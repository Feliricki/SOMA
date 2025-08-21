import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Todo } from '@prisma/client';

interface Params {
    params: {
        id: string;
    };
}

export async function DELETE(request: Request, { params }: Params) {
    try {
        // this conversion could fail
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }
        await prisma.todo.delete({
            where: { id },
        });
        return NextResponse.json({ message: 'Todo deleted' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting todo' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: Params) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const { title, createdAt, dueDate, parentId  } = await request.json() as Todo;

        const updatedTodo = await prisma.todo.update({
            where: {
                id: id
            },
            data: {
                title,
                createdAt,
                dueDate,
                parentId
            }
        });

        return NextResponse.json({ message: "Todo updated successfully", data: updatedTodo }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: 'Error updating a todo' }, { status: 500 });
    }
}
