"use client";
import React, { useState } from "react";
import { sendOtp } from "../../../lib/otp";

const page = () => {
  const [Email, setEmail] = useState("");
  const handleSend = async () => {
    const verify = await sendOtp(Email);
    console.log(verify);
  };
  return (
    <div>
      <input type="text" onChange={(e) => setEmail(e.target.value)} />
      <button onClick={handleSend}>send</button>
    </div>
  );
};

export default page;
