const Joi = require('joi');
const express =  require('express');
const { response } = require('express');
const { send } = require('process');

const app = express();
app.use(express.json());

var dataStore = [];

app.post('/data/create' ,(req,res) =>{
    
    const dataID = dataStore.find(x => parseInt(x.key) === parseInt(req.body.key));
    if(dataID) return res.status(403).send("Data with given Key already exists");
    
    const result =  validateItem(req.body);
    const { error } =  validateItem(req.body);
    if(error) {
        //400 Bad Request
        return res.status(400).send(result.error.details[0].message);
    }

    const now = new Date()
	const item = {
        key: req.body.key,
		value: req.body.value,
		ttl: parseInt(now.getTime()) + parseInt(req.body.ttl)*1000,
    };

    const sizeObject = Buffer.byteLength(JSON.stringify(item));
    
    if(sizeObject > (16*1024))    return res.send("--ERROR--\nJSON Object greater than 16KB");

    const size = Buffer.byteLength(JSON.stringify(dataStore));
    if((parseInt(sizeObject)+parseInt(size)) > 1024*1024*1024)  return res.send("--ERROR--\nTotal file size will be greater than 1GB after adding.");
    
    dataStore.push(item);
    res.send(`Data = ${JSON.stringify(req.body)} has been succesfully pushed`);
    
});
app.get('/data/read/:key', (req,res) => {
    const dataID = dataStore.find(x => parseInt(x.key) === parseInt(req.params.key));
    if(!dataID) return res.status(404).send("Data with given Key does not exist");

    const now = new Date()
    currentTime = now.getTime();
    if(parseInt(dataID.ttl) < parseInt(currentTime)) return res.send("--Read Operation not available.--\nTime to live expired for the key:" + req.params.key); 
    
    else return res.send("Required Data: "+JSON.stringify(dataID));
});

app.delete('/data/delete/:key',(req,res) => {
    const dataID = dataStore.find(x => parseInt(x.key) === parseInt(req.params.key));
    if(!dataID) return res.status(404).send("Data with given Key does not exist");

    const now = new Date()
    currentTime = now.getTime();
    if(parseInt(dataID.ttl) < parseInt(currentTime)) return res.send("--Delete Operation not available.--\nTime to live expired for the key:" + req.params.key); 

    const index = dataStore.indexOf(dataID);
    dataStore.splice(index);

    return res.send(`Data with key ${req.params.key} has been deleted.`);
});

function validateItem(item) {
    const schema = {
        key: Joi.string().min(1).max(32).required(),
        value: Joi.string().min(1).required(),
        ttl: Joi.number().required()

    };
    return Joi.validate(item, schema);


}
 
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Listening on port ${port}....`));

