import express from 'express';
const app = express();
const port = 3000;


let todo = [];

app.use(express.json);

app.get("/todos", (req, res) => {
   res.json(todo); 
});

app.listen(port, () =>{
   console.log(`server listining on port ${port}`);
});
