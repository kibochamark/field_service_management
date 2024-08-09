export type GlobalError = Error & {
        status?:string;
        statusCode?:number;
}