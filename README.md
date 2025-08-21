## Solution

- As a disclaimer, this was my first time using next.js and prisma. Although I tried to carry over ideas from my experience with ASP.NET and Angular over, I realise that there is much room for improvement in this project. Thanks for you time.
- Another disclaimer, you need to set the `PEXEL_KEY` environment variable in a `.env` file for this project to work

### Part 1: Due Dates
1. This required some changes to the sql schema. I added the option to add optional due date to each new todo entry
2. After applying the new migration, I made the necessary changes to the template such as adding the new date stateful variable
3. Also added the helper function called `isOverDue` to help with verifying the overdue status of each todo
4. The text of the due date changes dynamically depending on whether the todo is overdue or not


### Part 2: Image Generation

1. I started out by settup the endpoint on the backend to avoid leaking the pexels api key
2. The endpoint handles `GET` with a `query` parameter and makes the API call to pexels with the appropriate authorization headers set
3. On the frontend, I set up the `images` state varable to both store and cache the images corresponding to each todo
4. Upon fetching the `todos` from the backend, a `useEffect` hook triggers to loads the images
5. The template, checks the `images` variable, and will either rendering a loading animation or the image depending on whether the corresponding image has been set

### Part 3: Task Dependency

1. I started by designing and then applying what I felt was the appropriate migration to handle task dependencies. That being a self-join relationship where the `parentId`s are optionally set to another todo within the same table
2. Then I got to work on setting up the backend endpoint, which now handles `PUT` requests for updating certain todo tasks. Our primary usage will be to set the `parentId`
3. My next objective involved looking for a suitable visualization library to handle DAGs (directed acyclic graphs). I ended up choosing `dagra` for the graph data structures and layout calculations, and `reactflow` for the visualizations themselves
4. I then created a separate route for each `todo` where the user would have the option to observe the graph, set dependent todos, get its earliest start date, and observe the critical path
4. After much reading and debugging, I managed to get the visualizations up and running (only the nodes at this point) using a memoized function to avoid rerenders and lag
6. The todo objects are used to create a graph object, complete with Nodes and Edges. The nodes corresponding to each todo and the edges to the parent-child connection between each todo (if present)
7. The critical path is calculated by finding root nodes (nodes with no parents todo), and then finding the farthest node from each root node using dfs for graph traversal
8. The earliest start date is calculated during this process, and the critical path is animated
9. On each todo's page, one can add a dependent todo through the use of the input field
10. Simply begin the title of the todo you want to add as a dependent todo, and the autocomplete dropdown should open
11. Click on the dropdown option you want, and afterwards, the page should reload, and the task should appear as a dependent task in the graph visualizations if it passed validations
12. The validation itself is somewhat complex. Checking for circular dependencies involved creating a topological ordering of the graph corresponding to the todos and verifying that the final ordering has the same length as the original list
13. After the validation passes, a `PUT` request is sent to our aforementioned API endpoint, and if successful, the page is reloaded and updated
14. If the validation fails or the fetch request fails, then nothing changes

- Given more time, I would probably split up the visualization logic and the `todo:id` page into separate files and clean up the statement management

### Demonstration

[![Project Demo](https://github.com/Feliricki/SOMA/gif/demonstration.gif?raw=true)]

## Soma Capital Technical Assessment

This is a technical assessment as part of the interview process for Soma Capital.

> [!IMPORTANT]  
> You will need a Pexels API key to complete the technical assessment portion of the application. You can sign up for a free API key at https://www.pexels.com/api/  

To begin, clone this repository to your local machine.

## Development

This is a [NextJS](https://nextjs.org) app, with a SQLite-based backend, intended to be run with the LTS version of Node.

To run the development server:

```bash
npm i
npm run dev
```

## Task:

Modify the code to add support for due dates, image previews, and task dependencies.

### Part 1: Due Dates - Done

When a new task is created, users should be able to set a due date.

When showing the task list is shown, it must display the due date, and if the date is past the current time, the due date should be in red.

### Part 2: Image Generation - Done

When a todo is created, search for and display a relevant image to visualize the task to be done. 

To do this, make a request to the [Pexels API](https://www.pexels.com/api/) using the task description as a search query. Display the returned image to the user within the appropriate todo item. While the image is being loaded, indicate a loading state.

You will need to sign up for a free Pexels API key to make the fetch request. 

### Part 3: Task Dependencies

Implement a task dependency system that allows tasks to depend on other tasks. The system must:

1. Allow tasks to have multiple dependencies
2. Prevent circular dependencies
3. Show the critical path
4. Calculate the earliest possible start date for each task based on its dependencies
5. Visualize the dependency graph

## Submission:

1. Add a new "Solution" section to this README with a description and screenshot or recording of your solution. 
2. Push your changes to a public GitHub repository.
3. Submit a link to your repository in the application form.

Thanks for your time and effort. We'll be in touch soon!
