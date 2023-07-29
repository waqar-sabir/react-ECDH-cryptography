import React, { useState } from 'react';
import './App.css';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { ec as EC, hash as SHA256 } from 'elliptic';

const App = () => {
  const [formData, setFormData] = useState({});
  const ec = new EC('secp256k1'); // Elliptic curve algorithm

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Step 1: Generate ECDH key pair
    const privateKeyPair = ec.genKeyPair();
    const privateKey = privateKeyPair.getPrivate('hex');
    const publicKeyPair = ec.keyFromPrivate(privateKey, 'hex');
    const publicKey = publicKeyPair.getPublic('hex');

    // Step 2: Send the public key to the backend along with the encrypted form data
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(formData), publicKey).toString();
    const encryptedDataPayload = {
      publicKey: publicKey,
      encryptedData,
    };

    // Step 3: Sign the form data with the public key
    const encryptedDataHash = CryptoJS.SHA256(encryptedData).toString();
    const signature = publicKeyPair.sign(encryptedDataHash).toDER('hex');

    // Step 4: Send the signature to the backend;
    encryptedDataPayload.signature = signature;
    try {
      const backendResponse = await axios.post('http://localhost:4000/api/v1/users/submit/encrypt', encryptedDataPayload);
      const data = backendResponse.data;
      const bytes = CryptoJS.AES.decrypt(data.encrypted_data, publicKey);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      console.log('decryptedData', JSON.parse(decryptedData));
    } catch (error) {
      console.error('Error:', error.message);
    }
  };

  return (
    <div className="styles">
      <input type="text" name="name" placeholder="Name" className="inputStyles" onChange={handleChange} />
      <input type="email" name="email" placeholder="Email" className="inputStyles" onChange={handleChange} />
      <button type="submit" onClick={handleSubmit} className="buttonStyles">
        Submit
      </button>
    </div>
  );
}

export default App;

