//Import required packages
const fs = require('fs');
const Joi = require('joi');
const express =  require('express');
const { response } = require('express');
const { send } = require('process');

const app = express();
app.use(express.json());


let dataStore = []; //Global File Variable


//Create Operation
app.post('/data/create' ,(req,res) =>{
    //Check if the given key already exists
    const dataID = dataStore.find(x => parseInt(x.key) === parseInt(req.body.key));
    if(dataID) return res.status(403).send("Data with given Key already exists");
    

    //Input Validation
    const result =  validateCreate(req.body);
    const { error } =  validateCreate(req.body);
    if(error) {
        return res.status(400).send(result.error.details[0].message);
    }

    
    const now = new Date() //Create current TimeStamp

    //Creating JSON Object
	const item = {
        key: req.body.key,
		value: req.body.value,
		ttl: parseInt(now.getTime()) + parseInt(req.body.ttl)*1000, //Adding Time-to-live to current time
    };

    //Validating JSON Object Size (<= 16kb)
    const sizeObject = Buffer.byteLength(JSON.stringify(item));
    if(sizeObject > (16*1024))    return res.send("--ERROR--\nJSON Object greater than 16KB");

    //Validating final file size (<= 1GB)
    const size = Buffer.byteLength(JSON.stringify(dataStore));
    if((parseInt(sizeObject)+parseInt(size)) > 1024*1024*1024)  return res.send("--ERROR--\nTotal file size will be greater than 1GB after adding.");
    
    
    dataStore.push(item); //Pushing JSON Object to the main file

    return res.send(`Data = ${JSON.stringify(req.body)} has been succesfully pushed`); //Return pushed data to user
    
});



//Read Operation
app.get('/data/read/:key', (req,res) => {

    //Check if the given key already exists
    const dataID = dataStore.find(x => x.key === req.params.key);
    if(!dataID) return res.status(404).send("Data with given Key does not exist");

    
    const now = new Date() //Current Timestamp
    currentTime = now.getTime(); //Fetching time from the timestamp

    //Check if the JSON Object with given key has expired or not
    if(parseInt(dataID.ttl) < parseInt(currentTime)) return res.send("--Read Operation not available.--\nTime to live expired for the key:" + req.params.key); 
    
    //If not expired, return requested data
    else return res.send("Required Data: "+JSON.stringify(dataID));
});



//Delete Operation
app.delete('/data/delete/:key',(req,res) => {

    //Check if the given key already exists
    const dataID = dataStore.find(x => parseInt(x.key) === parseInt(req.params.key));
    if(!dataID) return res.status(404).send("Data with given Key does not exist");

    
    const now = new Date() //Current Timesstamp
    currentTime = now.getTime(); //Fetching time from the timestamp

    //Check if the JSON Object with given key has expired or not
    if(parseInt(dataID.ttl) < parseInt(currentTime)) return res.send("--Delete Operation not available.--\nTime to live expired for the key:" + req.params.key); 

    //If not expired, delete the requested data
    const index = dataStore.indexOf(dataID);
    dataStore.splice(index);

    //Return deleted data key
    return res.send(`Data with key ${req.params.key} has been deleted.`);
});



//Update Operation (Additional)
app.put('/data/update/:key',(req,res) => {

    //Check if the given key already exists
    const dataID = dataStore.find(x => x.key === req.params.key);
    if(!dataID) return res.status(404).send("Data with given Key does not exist");

    const now = new Date() //Current Timesstamp
    currentTime = now.getTime(); //Fetching time from the timestamp

    //Check if the JSON Object with given key has expired or not
    if(parseInt(dataID.ttl) < parseInt(currentTime)) return res.send("--Update Operation not available.--\nTime to live expired for the key:" + req.params.key); 

    //Validate the given update input
    const result =  validateUpdate(req.body);
    const { error } =  validateUpdate(req.body);
    if(error) {
        //400 Bad Request
        return res.status(400).send(result.error.details[0].message);
    }

    //Validating JSON Object Size (<= 16KB)
    const sizeObject = Buffer.byteLength(JSON.stringify(req.body));
    if(sizeObject > (16*1024))    return res.send("--ERROR--\nJSON Object greater than 16KB");

    //Validating file size after updating (<= 1 GB)
    const size = Buffer.byteLength(JSON.stringify(dataStore));
    if((parseInt(sizeObject)+parseInt(size)) > 1024*1024*1024)  return res.send("--ERROR--\nTotal file size will be greater than 1GB after updating.");
    
    //Updating Value and TTL(Time To Live)
	dataID.value = req.body.value;
	dataID.ttl = parseInt(now.getTime()) + parseInt(req.body.ttl)*1000;

    //Return updated JSON Object Key
    return res.send(`Data with key = ${req.params.key} has been succesfully updated`);

});

//Input Validation function for creating new data
function validateCreate(item) {

    //Required schema of the input data
    const schema = {
        key: Joi.string().min(1).max(32).required(),
        value: Joi.string().min(1).required(),
        ttl: Joi.number().required()

    };
    return Joi.validate(item, schema); //Return validation result
}

//Input Validation function to updating existing data
function validateUpdate(item) {

    //Required schema of the input data
    const schema = {
        value: Joi.string().min(1).required(),
        ttl: Joi.number().required()

    };
    return Joi.validate(item, schema); //Return validation result
}


//creating server on localhost
const port = process.env.PORT || 4000; //Specifying a given user port and a default port if user specified port is not available
app.listen(port, () => console.log(`Listening on port ${port}....`));

