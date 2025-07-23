// import prisma from "@/lib/prisma";
// import { DeleteTodoButton } from "./DeleteTodoButton";

// export const TodoList = async () => {
//   // 全ての Todo データを取得
//   const todos = await prisma.todo.findMany();

//   return (
//     <div className="space-y-5">
//       {todos.map((todo) => {
//         return (
//           <div
//             key={todo.id}
//             className="flex justify-between items-center p-3 bg-white rounded-lg"
//           >
//             {todo.title}
//             <DeleteTodoButton id={todo.id} />
//           </div>
//         );
//       })}
//     </div>
//   );
// };
