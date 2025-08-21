"use client"
import { Todo } from '@prisma/client';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import NavBar from './navbar/navbar';

export interface Image {
    id: number;
    width: number;
    height: number;
    url: string;
    src: {
        medium: string;
        portrait: string;
    };
    alt: string;
}

export default function Home() {
    // The following are used to create a new todo entry
    const [newTodo, setNewTodo] = useState("");
    const [date, setDate] = useState<string | null>("");

    const [todos, setTodos] = useState<Todo[]>([]);
    const [images, setImages] = useState<{ [id: number]: Image }>({}) // image storage and cache

    useEffect(() => {
        fetchTodos()
    }, []);

    const fetchTodos = async () => {
        try {
            const res = await fetch('/api/todos');
            const data = await res.json();
            setTodos(data);
        } catch (error) {
            console.error('Failed to fetch todos:', error);
        }
    };

    const fetchImage = useCallback(async (query: string) => {
        try {
            const res = await fetch(`/api/pexels/${query}`);
            const data = await res.json();
            return data.at(0) as Image;
        } catch (error) {
            console.error("Failed to fetch image: ", error);
            return null;
        }
    }, []);

    // update all images at once
    const fetchImages = async () => {
        const newImages: { [id: number]: Image } = {};
        for (const todo of todos) {
            // reuse the same image object when possible
            if (images[todo.id]) {
                newImages[todo.id] = images[todo.id];
                continue;
            }
            const fetchedImage = await fetchImage(todo.title);
            if (fetchedImage) {
                newImages[todo.id] = fetchedImage;
            }
        }

        setImages(newImages);
    }

    // Fetch new images when the tasks load in
    useEffect(() => {
        fetchImages();
    }, [todos]);


    const reset = () => {
        setNewTodo("");
        setDate("");
    }

    const handleAddTodo = async () => {
        if (!newTodo.trim()) return;
        try {
            await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTodo,
                    dueDate: date || null
                } as Todo),
            });
            reset();
            fetchTodos();
        } catch (error) {
            console.error('Failed to add todo:', error);
        }
    };

    const handleDeleteTodo = async (id: number) => {
        try {
            await fetch(`/api/todos/${id}`, {
                method: 'DELETE',
            });
            setTodos(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error('Failed to delete todo:', error);
        }
    };

    const dateToString = (date: Date) => {
        return date.toString().split("T").at(0) ?? "";
    }

    const isOverDue = (date: Date) => {
        const curDate = new Date();
        // prisma returns a string object rather than a Date
        date = date instanceof Date ? date : new Date(date);
        return curDate >= date;
    }

    return (
        <>
            <NavBar />
            <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
                <div className="w-full max-w-md">
                    <h1 className="text-4xl font-bold text-center text-white mb-8">Things To Do App</h1>
                    <div className="flex mb-6">
                        <input
                            type="text"
                            className="flex-grow p-3 rounded-l-full focus:outline-none text-gray-700"
                            placeholder="Add a new todo"
                            value={newTodo}
                            onChange={(e) => setNewTodo(e.target.value)}
                        />
                        <input type="date"
                            value={date ?? ""}
                            onChange={(e) => setDate(e.target.value)} />
                        <button
                            onClick={handleAddTodo}
                            className="bg-white text-indigo-600 p-3 rounded-r-full hover:bg-gray-100 transition duration-300"
                        >
                            Add
                        </button>
                    </div>
                    <ul>
                        {/* Todo List */}
                        {todos.map((todo) => (
                            <li
                                key={todo.id}
                                className="flex justify-between items-center bg-white bg-opacity-90 p-4 mb-4 rounded-lg shadow-lg"
                            >

                                {/* Image or Loading Animation */}
                                {images[todo.id] === undefined ?
                                    <div role="status">
                                        <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600 dark:fill-gray-300" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                        </svg>
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                    :
                                    <img
                                        key={images[todo.id].id}
                                        src={images[todo.id].src.medium}
                                        alt={images[todo.id].alt}
                                        style={{ width: '100px', height: 'auto', objectFit: 'cover' }}
                                    />
                                }
                                {/* Due Date */}
                                <Link href={`/todo/${todo.id}`} className="text-gray-800">{todo.title}</Link>
                                {todo.dueDate &&
                                    <span className={isOverDue(todo.dueDate) ? "text-red-800" : "text-gray-800"}
                                    >{dateToString(todo.dueDate)}</span>
                                }
                                <button
                                    onClick={() => handleDeleteTodo(todo.id)}
                                    className="text-red-500 hover:text-red-700 transition duration-300"
                                >
                                    {/* Delete Icon */}
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
}
