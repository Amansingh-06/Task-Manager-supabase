import React, { useEffect, useState } from 'react';
import { supabase } from './Supabase-client';

function Tasks() {
    const [task, setTask] = useState({ tasks: "", date: "" });
    const [allTask, setAllTask] = useState([]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!task.tasks || !task.date) return;

        const { data, error } = await supabase
            .from("Tasks")
            .insert([task])  // Correct way: wrap task in array
            .select()
            .single();

        if (error) {
            console.log("Inserting Error:", error.message);
        } else {
            setTask({ tasks: "", date: "" }); // reset input only on success
        }
    };

    const fetchTasks = async () => {
        const { data, error } = await supabase
            .from("Tasks")
            .select("*")
            .order("created_at", { ascending: true });

        if (error) {
            console.log("Fetching Error:", error.message);
        } else {
            setAllTask(data);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    useEffect(() => {
        const channel = supabase
            .channel("Task-channel")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "Tasks" },
                (payload) => {
                    const newTask = payload.new;
                    setAllTask((prev) => [...prev, newTask]);
                }
            )
            .subscribe();

        // cleanup on unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className='w-full min-h-screen bg-gray-600 flex flex-col justify-center items-center gap-12'>
            <div className='flex flex-col justify-between items-center gap-10'>
                <h1 className='text-white text-2xl font-bold'>Task Manager</h1>
                <div className='flex flex-col gap-5 text-white'>
                    <input
                        type="text"
                        placeholder='Task'
                        className='border-2 border-white p-1.5 w-64 rounded'
                        value={task.tasks}
                        onChange={(e) =>
                            setTask((prev) => ({ ...prev, tasks: e.target.value }))
                        }
                    />
                    <input
                        type="date"
                        className='border-2 border-white p-1.5 w-64 rounded'
                        value={task.date}
                        onChange={(e) =>
                            setTask((prev) => ({ ...prev, date: e.target.value }))
                        }
                    />
                </div>
                <button
                    className='px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white font-semibold'
                    onClick={handleSubmit}
                >
                    Add Task
                </button>
            </div>

            <div>
                <table className="min-w-[300px] max-w-3xs border border-gray-400 border-collapse text-left bg-white text-black">
                    <caption className="text-lg font-semibold py-2">Tasks</caption>
                    <thead>
                        <tr>
                            <th className="border border-gray-400 px-4 py-2 text-center">Created At</th>
                            <th className="border border-gray-400 px-4 py-2 text-center">Task</th>
                            <th className="border border-gray-400 px-4 py-2 text-center">Due Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allTask.length > 0 ? (
                            allTask.map((task, index) => (
                                <tr key={index}>
                                    <td className="border border-gray-400 px-4 py-2">{new Date(task.created_at).toLocaleString()}</td>
                                    <td className="border border-gray-400 px-4 py-2 break-words">{task.tasks}</td>
                                    <td className="border border-gray-400 px-4 py-2">{task.date}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="border px-4 py-2 text-center text-gray-500">No tasks found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Tasks;
