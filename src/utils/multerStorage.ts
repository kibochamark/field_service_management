// import multer from "multer"
// import path from "path"
// import {put} from "@vercel/blob"

// const storage = multer.diskStorage({
//     destination(req, file, callback) {
//         const blob = async()=>{
//             const blob = await put(file?.name, file, { access: 'public' });
//             return blob

//         }
//         // const publicDir = path.resolve(__dirname, "../tmp");

//         callback(null, blob);    },
//     filename(req, file, callback) {
//         callback(null, file.originalname)
//     },
// })

import multer from "multer";
import { put } from "@vercel/blob";

// Use memory storage to keep the file in memory
const storage = multer.memoryStorage();

export const upload = multer({ storage: storage });


// export const upload = multer({storage:storage})