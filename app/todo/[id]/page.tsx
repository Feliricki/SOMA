"use client"
import { Todo } from '@prisma/client';
import { useState, useEffect, useMemo } from 'react';
import TodoGraph from './todo-graph';
import ReactFlow, { Background, Controls, MiniMap, ReactFlowProvider } from 'reactflow';
import NavBar from '@/app/navbar/navbar';
import 'reactflow/dist/style.css';
import { getCriticalPath, validateGraph } from './graph-helpers';

interface Params {
    params: {
        id: string;
    }
}

const todoGraph = new TodoGraph();


// 1. [X] Allow tasks to have multiple dependencies
// 2. [X] Prevent circular dependencies
// 3. [X] Show the critical path
// 4. [X] Calculate the earliest possible start date based on its dependencies
// 5. [x] Visualize the dependeceny graph
export default function TodoView({ params }: Params) {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // state related to the input+autocomplete
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<Todo[]>([]);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    const [earliestStartDate, setEarliestStartDate] = useState<Date | null>(null);

    // fetch all of the todos for visuals
    useEffect(() => {
        const fetchTodos = async () => {
            try {
                const res = await fetch('/api/todos');
                const data = await res.json();
                setTodos(data);
            } catch (error) {
                console.error("Failed to fetch todos: ", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchTodos();
    }, []);


    const setDependentTodo = async (childId: number) => {
        try {
            setSearchTerm("");
            setIsDropdownVisible(false);

            const childTodo = todos.find(t => t.id === childId);
            if (!childTodo || childTodo.id.toString() === params.id || childTodo.parentId?.toString() === params.id) {
                throw new Error("Invalid node was chosen");
            }

            const parentTodo = todos.find(t => t.id.toString() === params.id);
            if (!parentTodo) throw new Error("Parent node not set");
            // validate
            if (!validateGraph(childTodo, parentTodo, todos)) {
                throw new Error("Invalid dependency circular dependency detected");
            }

            const modifiedChild: Todo = {
                ...childTodo,
                parentId: Number.parseInt(params.id)
            }

            const response = await fetch(`/api/todos/${childId}`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(modifiedChild)
            });

            // hard reload to update the visuals
            window.location.reload();

        } catch (error) {
            console.error("Error: ", error);
        }
    }

    // initialize the graph once the todos load
    const memoizedGraph = useMemo(() => {
        if (!todos || todos.length === 0) {
            return { nodes: [], edges: [] };
        }

        const mainTodo = todos.find(t => t.id.toString() === params.id);

        todoGraph.init(todos);
        const initialNodes = todoGraph.getNodes();
        const initialEdges = todoGraph.getEdges();

        const finalNodes = initialNodes.map(node => {
            if (mainTodo && node.id === mainTodo.id.toString()) {
                return {
                    ...node,
                    style: {
                        border: '3px solid #ff0072',
                        boxShadow: '0 0 20px 7px rgba(255, 0, 114, 0.5)',
                        zIndex: 10,
                    }
                };
            }
            return node;
        });

        // logic for highlighting the critical path
        const criticalPath = getCriticalPath(todos);
        setEarliestStartDate(new Date(criticalPath[criticalPath.length - 1].createdAt));

        const criticalEdges = new Set<string>();
        for (let i = 0; i < criticalPath.length; i++) {
            if (i + 1 >= criticalPath.length) {
                continue;
            }
            criticalEdges.add(`${criticalPath[i + 1].id}-${criticalPath[i].id}`);
        }

        const finalEdges = initialEdges.map(edge => {
            if (criticalEdges.has(`${edge.source}-${edge.target}`)) {
                return {
                    ...edge,
                    style: {
                        stroke: '#10B981 !important',
                        strokeWidth: "2.5px !important"
                    },
                    animated: true
                }
            }
            return edge;
        });

        return { nodes: finalNodes, edges: finalEdges };
    }, [todos, params.id]);


    // update the autocomplete suggestions
    useEffect(() => {
        if (searchTerm.trim().length > 0) {
            const filteredTodos = todos.filter(todo =>
                todo.title.toLowerCase().startsWith(searchTerm.toLowerCase())
            );

            setSuggestions(filteredTodos);
            setIsDropdownVisible(true); // Show dropdown if there are suggestions
        } else {
            setSuggestions([]); // Clear suggestions if input is empty
            setIsDropdownVisible(false); // Hide dropdown
        }
    }, [searchTerm, todos]); // This effect depends on the search term and the master list of todos

    return <>
        <NavBar />
        <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
            <div className="w-full max-w-6xl">
                <h1 className="text-4xl font-bold text-center text-white mb-8">Things To Do App</h1>
                <div className="bg-white rounded-lg shadow-lg flex flex-col" style={{ width: '100%', height: '80vh' }}>

                    {/* 1. HEADER AREA (Input + Description) */}
                    <div className="p-4 border-b border-gray-200">

                        {/* Input with Autocomplete */}
                        <div className="relative z-20">
                            {/* Search Icon */}
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>

                            <input
                                type="text"
                                placeholder="Set a dependent task by title..."
                                className="w-full pl-11 pr-4 py-3 bg-white rounded-lg shadow-sm border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => { if (suggestions.length > 0) setIsDropdownVisible(true); }}
                                onBlur={() => { setTimeout(() => setIsDropdownVisible(false), 200); }}
                            />

                            {/* Autocomplete Dropdown */}
                            {isDropdownVisible && suggestions.length > 0 && (
                                <div className="absolute w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                                    <ul>
                                        {suggestions.map((todo) => (
                                            <li
                                                key={todo.id}
                                                className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-black"
                                                onClick={() => setDependentTodo(todo.id)}
                                            >
                                                {`#${todo.id}.${todo.title}`}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        {todos && <p className="mt-2 text-sm text-gray-500">
                            - Looking at todo: {todos.find(t => t.id.toString() === params.id)?.title ?? "N/A"} (Highlighted)
                        </p>}
                        {/* Description Text */}
                        <p className="mt-2 text-sm text-gray-500">
                            - The critical path is animated and is determined by the longest path to a leaf node.
                        </p>
                        {/* Earliest Start Date */}
                        {todos && earliestStartDate && <p className="mt-2 text-sm text-gray-500">
                            - Earliest start date for todo:
                            {todos.find(t => t.id.toString() === params.id)?.title ?? "N/A"} is {earliestStartDate?.toLocaleDateString()} based on the earliest created on date of its parent todos
                        </p>}
                    </div>

                    {/* 2. GRAPH AREA (This will grow to fill the rest of the space) */}
                    <div className="flex-grow relative">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">Loading graph...</div>
                        ) : (
                            <ReactFlowProvider>
                                <ReactFlow
                                    defaultNodes={memoizedGraph.nodes}
                                    defaultEdges={memoizedGraph.edges}
                                    fitView
                                    nodesDraggable={false}
                                    elementsSelectable={false}
                                >
                                    <MiniMap />
                                    <Controls />
                                    <Background />
                                </ReactFlow>
                            </ReactFlowProvider>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </>;
}
