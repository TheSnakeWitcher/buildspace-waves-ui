import React from "react";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./util/WavePortal.json"

const getEthereumObject = () => window.ethereum;

const findMetamaskAccount = async () => {
  try {
    const ethereum = getEthereumObject();

    if (!ethereum) {
      console.error("Make sure you hae metamask installed");
      return null;
    }
    console.log("We have installed ethereum object", ethereum);

    const accounts = await ethereum.request({ method: "eth_accounts" });
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found authorized account:", account);
      return account;
    } else {
      console.error("No authorized account found");
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const contractAddress = "0x59cE91F8854FAda003aF8DC258FFe253A23E7d27" ;
  const contractABI = abi.abi ;

  const connectWallet = async () => {
    try {
      const ethereum = getEthereumObject();
      if (!ethereum) {
        alert("get metamask");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected: ", accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        // write to blockchain
        const waveTxn = await wavePortalContract.wave() ;
        console.log("mining...",waveTxn.hash) ;
        waveTxn.wait() ;
        console.log("mined...",waveTxn.hash) ;

        // read from blockchain
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getAllWaves = async () => {
    try {
      const {ethereum} = window ;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum) ;
        const signer = provider.getSigner() ;
        const wavePortalContract = new ethers.Contract(contractAddress,contractABI,signer) ;
        const waves = await wavePortalContract.getAllWaves() ;

        let wavesCleaned = [] ;
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          })
        });

        setAllWaves(wavesCleaned) ;
      } else {
        console.log("Ethereum doesn't exist") ;
      }

    } catch (error) {
      console.log(error) ;
    }
  }

  useEffect(() => {
    const account = findMetamaskAccount();
    if (account !== null) {
      setCurrentAccount(account);
      console.log("account seted")
      getAllWaves();
    }

    let wavePortalContract ; 
    const onNewWave = (from,timestamp,message) => {
      console.log("New wave",from,timestamp,message)
      setAllWaves(prevState => [ 
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ])
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum) ;
      const signer = provider.getSigner() ;
      
      wavePortalContract = new ethers.Contract(contractAddress,contractABI,signer) ;
      wavePortalContract.on("NewWave",onNewWave)
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave",onNewWave);
      }
    };
  }, []);

  useEffect( () => {
    getAllWaves();
  },[allWaves])

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">👋 Hello motherfucker!</div>

        <div className="bio">
          I am alex and I learning ethereum development
          Connect your Ethereum wallet and wave at me!
        </div>
        
        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>
        
        {!currentAccount && (
        <button className="waveButton" onClick={connectWallet}>
          Connect Wallet
        </button>
        )}

        {allWaves.map((wave,index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace",marginTop:"16px",padding:"8px"}}>
              <div> Address: {wave.address} </div>
              <div> Time: {wave.timestamp.toString()} </div>
              <div> Message: {wave.message} </div>
            </div>
          )
        })}

      </div>
    </div>
  );
}
