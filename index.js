const Joi = require('joi');
const express =  require('express');
const { response } = require('express');
const app = express();

app.use(express.json());

var dataStore = [];

app.get('/api/store/:key', (req,res) => {
    const dataID = dataStore.find(x => parseInt(x.key) === parseInt(req.params.key));
    if(!dataID) return res.status(404).send("Data with given Key does not exist");

    const now = new Date()
    currentTime = now.getTime();
    if(dataID.ttl < currentTime) return res.send("Current Time :"+now.getTime()+"\nTime to live expired for the key:" + req.params.key); 
    
    else return res.send("Current Time :"+now.getTime()+JSON.stringify(dataID));
});

app.post('/api/store' ,(req,res) =>{
    
    const dataID = dataStore.find(x => parseInt(x.key) === parseInt(req.body.key));
    if(dataID) return res.status(403).send("Data with given Key already exists");

    const now = new Date()
	const item = {
        key: req.body.key,
		value: req.body.value,
		ttl: now.getTime() + req.body.ttl,
    };
 
    
    dataStore.push(item);
    res.send(`Data = ${JSON.stringify(req.body)} has been succesfully pushed`);
    
});
    
  
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Listening on port ${port}....`));
