"use client";
import React, { useState } from "react";
import api from "../../../lib/axios";
import { redirect } from "next/navigation";
import toast,{Toaster} from "react-hot-toast";
export default function Login() {
    // complete authentication frontend
    const [email, setEmail] = useState(""); 
    const [password, setPassword] = useState("");
    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        try {
            const data = await api.post("/api/login", { email, password });
            console.log(data)
            if(data.status==201)redirect('/');
            else toast.error(data.data.message);
        }catch (error) {
            if (error instanceof Error) {
                console.log(error.message);
            } else {
                console.error("Unknown error", error);
            }
        }}
        return (
    
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Toaster/>
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Login
        </h2>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
            onChange={(e) => setPassword(e.target.value)}
          />
           <div className="flex justify-end">
          <button onClick={()=>redirect("/register")} className="text-blue-400">
            Register ➡️
          </button>
        </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-500 p-3 text-white transition hover:bg-blue-600 focus:outline-none"
            onClick={handleSubmit}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
