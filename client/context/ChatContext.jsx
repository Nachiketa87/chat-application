import { useContext, useEffect } from "react";
import { useState } from "react";
import { createContext } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";


export const ChatContext = createContext();

export const ChatProvider = ({children}) => {
    
    const [messages,setMessages] = useState([]);
    const [users,setUsers] = useState([]);
    const [selectedUser,setSelectedUser] = useState(null);
    const [unseenMessages,setUnseenMessages] = useState({});

    const {socket,axios,authUser} = useContext(AuthContext);

    //fn to get all users
    const getUsers = async () => {
        try {
            const {data} = await axios.get("/api/messages/users");
            if(data.success){
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    //fn to get msg for selected one
    const getMessages = async (userId) => {
        try {
            const {data} = await axios.get(`/api/messages/${userId}`);
            if(data.success){
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    //realtime msg-subscribe
    const subscribeToMessages = async () => {
        if(!socket) return;

        socket.on("newMessage", (newMessage)=>{
            if(selectedUser && newMessage.senderId === selectedUser._id){
                newMessage.seen = true;
                setMessages((prevMessages)=>[...prevMessages,newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);
            }
            else{
                setUnseenMessages((prevUnseenMessages)=>({
                    ...prevUnseenMessages, [newMessage.senderId] : //key : val
                    prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId]+1 : 1
                }))
            }
        })
    }

    //fn to send msg
    const sendMessage = async (messageData) => {
        try {
            const {data} = await axios.post(`/api/messages/send/${selectedUser._id}`,messageData)
            if(data.success){
                setMessages((prevMessages)=>[...prevMessages,data.newMessage])
            }
            else toast.error(error.message);
        
        } catch (error) {
            toast.error(error.message);
        }
    }

    //fn to unsub from mssges
    const unsubscribeFromMessages = () => {
        if(socket) socket.off("newMessage");
    }

    useEffect(()=>{
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    },[socket,selectedUser]);

    useEffect(()=>{
        if(!authUser){
            setSelectedUser(null);
            setMessages([]);
        }
    },[authUser])
    
    const value = {
        messages,users,selectedUser,getUsers,setUnseenMessages,
        setMessages,sendMessage,setSelectedUser,unseenMessages,
        getMessages
    }

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}