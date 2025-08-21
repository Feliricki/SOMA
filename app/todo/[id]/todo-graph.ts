import { graphlib, layout } from "@dagrejs/dagre";
import { Todo } from "@prisma/client";
import { Node as ReactNode, Edge as ReactEdge } from 'reactflow';

export interface TodoNode {
    label: string;
    todo: Todo;
}

const nodeWidth = 172;
const nodeHeight = 36;

class TodoGraph {

    private graph?: graphlib.Graph;

    private nodes: ReactNode[] = [];
    private edges: ReactEdge[] = [];


    constructor() {
    }

    init(todos: Todo[]) {
        this.nodes = [];
        this.edges = [];
        const graph = new graphlib.Graph<TodoNode>({
            directed: true,
            compound: true,
        }).setGraph({
            rankdir: "TB",      // Top to bottom graph
            ranksep: 70,        // Vertical distance between ranks
            nodesep: 200,        // Horizontal distance between nodes in the same rank
        });

        this.graph = graph;
        this.graph.setDefaultEdgeLabel(() => ({}));

        // set the node before the edges
        for (const todo of todos) {
            this.graph.setNode(todo.id.toString(), {
                label: todo.title,
                height: 50,
                width: 150,
            });
        }

        // set the edges
        for (const todo of todos) {
            if (todo.parentId !== null) {
                const parentIdStr = todo.parentId.toString();
                const childIdStr = todo.id.toString();
                this.graph.setEdge({
                    v: parentIdStr,
                    w: childIdStr
                });
            }
        }

        layout(this.graph);

        // react flow nodes
        for (const todo of todos) {
            const nodePosition = this.graph.node(todo.id.toString());
            if (!nodePosition) continue; // Safety check

            // edit label
            const label = todo.dueDate !== null ?
                `Id:${todo.id} Title:${todo.title} Due:${new Date(todo.dueDate).toLocaleDateString()}` :
                `Id:${todo.id}. ${todo.title}`;
            this.nodes.push({
                id: todo.id.toString(),
                position: {
                    x: nodePosition.x - nodeWidth / 2,
                    y: nodePosition.y - nodeHeight / 2,
                },
                data: {
                    label: label,
                }
            });
        }

        // set react flow edges
        for (const edge of this.graph.edges()) {
            this.edges.push({
                id: `e-${edge.v}-${edge.w}`, // e.g., "e-1-2"
                source: edge.v, // v is the source ID
                target: edge.w, // w is the target ID
            });
        }

        // console.log("Node: ", this.nodes, "Edges: ", this.edges);
        return this.graph;
    }

    getGraph() {
        return this.graph;
    }

    getNodes(): ReactNode[] {
        return this.nodes;
    }

    getEdges(): ReactEdge[] {
        return this.edges;
    }

}

export default TodoGraph;
