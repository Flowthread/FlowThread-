import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { collection, query, getDocs, updateDoc, doc, where, collectionGroup } from "firebase/firestore";
import { UserProfile, Thread, Task, WorkPost } from "../types";
import { Shield, Users, MessageSquare, Briefcase, AlertTriangle, BarChart3, Search, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Admin() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "threads" | "tasks" | "disputes" | "analytics">("analytics");

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      if (!auth.currentUser) {
        navigate("/");
        return;
      }
      
      const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", auth.currentUser.uid)));
      const userData = userDoc.docs[0]?.data() as UserProfile | undefined;
      
      if (auth.currentUser.email === "mahjabeenismail5@gmail.com" || userData?.role === "admin") {
        setIsAdmin(true);
        fetchData();
      } else {
        toast.error("Unauthorized access");
        navigate("/");
      }
    };
    
    checkAdmin();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersSnap, threadsSnap, tasksSnap, workPostsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "threads")),
        getDocs(collectionGroup(db, "tasks")),
        getDocs(collection(db, "workPosts"))
      ]);

      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as UserProfile)));
      setThreads(threadsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Thread)));
      setTasks(tasksSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      setWorkPosts(workPostsSnap.docs.map(d => ({ id: d.id, ...d.data() } as WorkPost)));
    } catch (err) {
      console.error("Error fetching admin data", err);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "users", userId), { banned: !currentStatus });
      setUsers(users.map(u => u.uid === userId ? { ...u, banned: !currentStatus } : u));
      toast.success(`User ${!currentStatus ? 'banned' : 'unbanned'} successfully`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleResolveDispute = async (taskId: string, threadId: string, resolution: "client" | "freelancer") => {
    try {
      await updateDoc(doc(db, "threads", threadId, "tasks", taskId), {
        status: resolution === "client" ? "cancelled" : "completed",
      });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: resolution === "client" ? "cancelled" : "completed" } : t));
      toast.success(`Dispute resolved in favor of ${resolution}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `threads/${threadId}/tasks/${taskId}`);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div></div>;
  }

  if (!isAdmin) return null;

  const filteredUsers = users.filter(u => u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()));
  const disputedTasks = tasks.filter(t => t.status === "disputed");

  const analyticsData = [
    { name: 'Users', count: users.length },
    { name: 'Threads', count: threads.length },
    { name: 'Tasks', count: tasks.length },
    { name: 'Work Posts', count: workPosts.length },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center gap-3">
          <Shield className="text-indigo-600" size={24} />
          <h1 className="font-bold text-xl text-slate-900">Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: "analytics", icon: BarChart3, label: "Analytics" },
            { id: "users", icon: Users, label: "Users" },
            { id: "threads", icon: MessageSquare, label: "Threads" },
            { id: "tasks", icon: Briefcase, label: "Tasks" },
            { id: "disputes", icon: AlertTriangle, label: "Disputes", badge: disputedTasks.length },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} />
                {item.label}
              </div>
              {item.badge ? (
                <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-1 rounded-full">{item.badge}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button onClick={() => navigate("/")} className="w-full py-2 text-sm font-bold text-slate-500 hover:text-slate-900">
            Back to App
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Total Users", value: users.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Active Threads", value: threads.length, icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Total Tasks", value: tasks.length, icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Active Disputes", value: disputedTasks.length, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" },
              ].map(stat => (
                <div key={stat.label} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                    <stat.icon size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-96">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Platform Growth</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Manage Users</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Rating</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => (
                    <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="" className="w-10 h-10 rounded-full" />
                          <div>
                            <p className="font-bold text-slate-900">{user.displayName}</p>
                            <p className="text-slate-500 text-xs">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">{user.role}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">{user.rating?.toFixed(1) || 'N/A'}</td>
                      <td className="px-6 py-4">
                        {user.banned ? (
                          <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-xs font-bold">Banned</span>
                        ) : (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold">Active</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleBan(user.uid, !!user.banned)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${user.banned ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                        >
                          {user.banned ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "threads" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">All Threads</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {threads.map(thread => (
                <div key={thread.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900">{thread.title}</h3>
                      <p className="text-xs text-slate-500">ID: {thread.id}</p>
                    </div>
                    <span className="text-xs text-slate-400">{formatDistanceToNow(thread.updatedAt.toDate())} ago</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl mb-4">
                    <p className="text-sm text-slate-600 line-clamp-2">"{thread.lastMessage}"</p>
                  </div>
                  <div className="flex gap-2 text-xs text-slate-500 mb-4">
                    <span className="bg-slate-100 px-2 py-1 rounded-md">Client: {thread.clientId}</span>
                    <span className="bg-slate-100 px-2 py-1 rounded-md">Freelancer: {thread.freelancerId}</span>
                  </div>
                  <button 
                    onClick={() => navigate(`/threads/${thread.id}`)}
                    className="w-full py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors text-sm"
                  >
                    View Thread
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">All Tasks</h2>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Task</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Thread ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map(task => (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{task.title}</p>
                        <p className="text-slate-500 text-xs line-clamp-1">{task.description}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-indigo-600">${task.price}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          task.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                          task.status === 'disputed' ? 'bg-rose-100 text-rose-600' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-mono">{task.threadId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "disputes" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Active Disputes</h2>
            {disputedTasks.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 text-center">
                <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Disputes</h3>
                <p className="text-slate-500">All clear! There are no tasks currently in dispute.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {disputedTasks.map(task => (
                  <div key={task.id} className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{task.title}</h3>
                        <p className="text-sm text-slate-500">Thread ID: <span className="font-mono">{task.threadId}</span></p>
                      </div>
                      <div className="text-2xl font-black text-indigo-600">${task.price}</div>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-2xl mb-6">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Task Description</h4>
                      <p className="text-sm text-slate-700">{task.description}</p>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => handleResolveDispute(task.id, task.threadId, "freelancer")}
                        className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={18} />
                        Resolve for Freelancer (Pay)
                      </button>
                      <button
                        onClick={() => handleResolveDispute(task.id, task.threadId, "client")}
                        className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle size={18} />
                        Resolve for Client (Refund)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
