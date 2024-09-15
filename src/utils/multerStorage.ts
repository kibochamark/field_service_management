import multer from "multer"
import path from "path"

const storage = multer.diskStorage({
    destination(req, file, callback) {
        const publicDir = path.resolve(__dirname, "../tmp");
        callback(null, publicDir);    },
    filename(req, file, callback) {
        callback(null, file.originalname)
    },
})



export const upload = multer({storage:storage})