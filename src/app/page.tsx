"use client";


export default function Home() { 
  return (
  
  <div>hi</div>
);
}

// "use client";
// import { useEffect, useState } from "react";
// import { socket } from "../socket/client";

// export default function Home() {
//   const [messages, setMessages] = useState<string[]>([]);
//   const [input, setInput] = useState("");

//   useEffect(() => {
//     socket.connect();
//     if(socket.connected){

//       socket.emit("join",);//hardcoded
//       socket.on("receive-message", (msg) => {
//         console.log("received message", msg);
//         setMessages((prev) => [...prev, msg]);
//       });
//     }

//     return () => {
//       socket.disconnect();
//     };
//   }, []);

//   const sendMessage = () => {
//     socket.emit("send-message", input);
//     setInput("");
//   };

//   return (
//     <div>
//       <h1>Chat</h1>
//       <div>
//         {messages.map((m, i) => (
//           <p key={i}>{m}</p>
//         ))}
//       </div>
//       <input value={input} onChange={(e) => setInput(e.target.value)} />
//       <button onClick={sendMessage}>Send</button>
//     </div>
//   );
// }
