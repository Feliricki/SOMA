import { Todo } from "@prisma/client";
import Deque from 'double-ended-queue';

export function todoToGraph(todos: Todo[]) {

    const adjList = new Map<number, Todo[]>();
    for (const todo of todos) {
        adjList.set(todo.id, []);
    }

    for (const todo of todos) {
        if (todo.parentId === null) {
            continue;
        }

        const prev = adjList.get(todo.parentId);
        if (prev === undefined) continue;
        prev.push(todo);
    }

    return adjList;
}

// Validation Steps
// 1. Check for date: prev <= current
// 2. Check for circular dependency
export function validateGraph(child: Todo, parent: Todo, todos: Todo[]) {
    const roots = todos.filter(todo => todo.parentId === null);
    // circular dependency
    if (!roots && todos.length > 0) {
        console.warn("Circular dependency detected");
        return false;
    }

    if (child.parentId !== null) {
        console.warn("This todo already has a parent todo");
        return false;
    }

    // 1. Check for cycles first
    const graph = todoToGraph(todos);
    const parentDependents = graph.get(parent.id);
    if (parentDependents === undefined) {
        console.warn("Parent not found in the collection");
        return false;
    }

    if (parentDependents.find(t => t.id === child.id) === undefined) {
        parentDependents.push(child);
    } else {
        console.warn("The child todo is already a dependent of this todo");
        return false;
    }

    if (topologicalOrdering(graph).length !== todos.length) {
        console.warn("Circular dependency detected in topological ordering");
        return false;
    }

    return true;
}

// validate due dates
function bfsValidation(roots: Todo[], graph: Map<number, Todo[]>) {
    // 2. Check that dependent todos occur after the parent todo
    // bfs algorithm
    const q = new Deque(roots);
    const visited = new Map<number, Date | null>(
        roots.map(t => [t.id, t.dueDate === null ? null : new Date(t.dueDate)])
    );

    while (q.length > 0) {
        const nodes: Todo[] = [];
        while (q.length > 0) {
            nodes.push(q.removeFront() as Todo);
        }

        for (const node of nodes) {
            node.dueDate = node.dueDate === null ? null : new Date(node.dueDate);

            const children = graph.get(node.id);
            if (!children) continue;
            for (const child of children) {

                child.dueDate = child.dueDate === null ? null : new Date(child.dueDate);

                // dueDate validation
                if (child.dueDate === null) {
                    visited.set(child.id, node.dueDate);
                } else {
                    // the dependent todo must be after the parent's
                    if (node.dueDate !== null && node.dueDate > child.dueDate) {
                        console.log("invalid due date");
                        return false;
                    }
                    visited.set(child.id, child.dueDate);
                }
            }
        }
    }

    return true;
}


export function topologicalOrdering(graph: Map<number, Todo[]>) {
    const inDeg = new Map<number, number>(); // id -> degree of inward nodes
    for (const id of graph.keys()) {
        inDeg.set(id, 0);
    }
    for (const id of graph.keys()) {
        const children = graph.get(id);
        if (!children) continue;

        for (const child of children) {
            const childDeg = inDeg.get(child.id) ?? 0;
            inDeg.set(child.id, childDeg + 1);
        }
    }

    const curRoots = Array.from(inDeg.keys().filter(id => inDeg.get(id) === 0));
    const topOrdering = [...curRoots];

    while (curRoots.length > 0) {

        const curId = curRoots.pop() as number;
        const children = graph.get(curId);
        if (!children) continue;

        for (const child of children) {

            const childDeg = inDeg.get(child.id) ?? 1;
            inDeg.set(child.id, childDeg - 1);
            if (childDeg - 1 === 0) {
                curRoots.push(child.id);
                topOrdering.push(child.id);
            }
        }
    }

    return topOrdering;
}

// longest path - dfs
export function getCriticalPath(todos: Todo[]): Todo[] {
    const graph = todoToGraph(todos);
    const inDeg = new Map<number, number>(); // id -> degree of inward nodes
    for (const id of graph.keys()) {
        inDeg.set(id, 0);
    }
    for (const id of graph.keys()) {
        const children = graph.get(id);
        if (!children) continue;

        for (const child of children) {
            const childDeg = inDeg.get(child.id) ?? 0;
            inDeg.set(child.id, childDeg + 1);
        }
    }

    const roots = Array.from(inDeg.keys().filter(id => inDeg.get(id) === 0));
    let longestSol = { id: -1, length: 0 };
    for (const id of roots) {
        const curSol = longestPath(id, graph);
        if (curSol.length > longestSol.length) {
            longestSol = curSol;
        }
    }

    // longest is the 'latest' node in the graph with the longest path to reach it

    let curNode = todos.find(t => t.id === longestSol.id);
    if (curNode === undefined) return [];
    const path: Todo[] = [curNode];

    while (curNode) {
        const parent = todos.find(t => t.id === curNode?.parentId);
        if (parent) {
            path.push(parent);
            curNode = parent;
        } else {
            break;
        }
    }

    return path;
}

// finds the longest path using bfs
function longestPath(root: number, graph: Map<number, Todo[]>) {
    const visited = new Map<number, number>() // id -> path length
    visited.set(root, 0);

    const q = new Deque([root]);
    while (q.length > 0) {
        const nodes: number[] = [];
        while (q.length > 0) {
            nodes.push(q.removeFront() as number);
        }

        for (const node of nodes) {
            const children = graph.get(node);
            if (children === undefined) continue;
            for (const child of children) {
                const prev = visited.get(node) ?? 0;
                const cur = visited.get(child.id) ?? 0;
                if (!visited.has(child.id)) {
                    q.enqueue(child.id);
                }
                visited.set(child.id, Math.max(prev + 1, cur));
            }
        }
    }

    let bestSol = { id: -1, length: 0 };
    for (const id of visited.keys()) {
        const curLength = visited.get(id);
        if (curLength !== undefined && curLength > bestSol.length) {
            bestSol = { id: id, length: curLength };
        }
    }

    return bestSol;
}
