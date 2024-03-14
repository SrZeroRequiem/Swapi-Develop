const express = require('express');
const mysql = require('mysql')
const cors = require('cors')
const app = express();

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "swapi"
})
app.use(cors({
    origin: 'http://localhost:3000'
}))
app.use(express.json())

app.get("/planets",(req,res)=>{
    db.query('SELECT * FROM planets WHERE NAME != ?',('unknown'), (err, result)=>{
        if(err){
            console.error(err)
        }else{
            res.send(result)
        }
    })

})
app.get("/films",(req,res)=>{
    db.query('SELECT * FROM films', (err, result)=>{
        if(err){
            console.error(err)
        }else{
            let formated = result.map((obj)=>{
                obj["starships"] = JSON.parse(obj["starships"])
                obj["planets"] = JSON.parse(obj["planets"])
                obj["vehicles"] = JSON.parse(obj["vehicles"])
                obj["species"] = JSON.parse(obj["species"])
                obj["characters"] = JSON.parse(obj["characters"])
                return obj

            })
            res.send(formated)
        }
    })

})
app.get("/people",(req,res)=>{
    db.query('SELECT * FROM people', (err, result)=>{
        if(err){
            console.error(err)
        }else{
            res.send(result)
        }
    })

})

app.get("/starships",(req,res)=>{
    db.query('SELECT * FROM starships', (err, result)=>{
        if(err){
            console.error(err)
        }else{
            let starships = result
            db.query('SELECT * FROM transport', (err, result)=>{
                if(err){
                    console.error(err)
                }else{
                    let merged = result.map((obj)=>{
                        const handlerShip = starships.filter((ship)=>{return ship.pk === Number(obj.pk)})
                        if(handlerShip[0]!== undefined){
                            let jsonPilots = JSON.parse(handlerShip[0].pilots)
                            obj["pilots"] = jsonPilots.map((pilot)=>Number(pilot))
                            obj["MGLT"] = handlerShip[0].MGLT
                            obj["starship_class"] = handlerShip[0].starship_class
                            obj["hyperdrive_rating"] = handlerShip[0].hyperdrive_rating
                            return obj
                        } else{
                            return undefined
                        }
                    })
                    merged = merged.filter((m)=> m!==undefined)
                    res.send(merged)
                }
            })
        }
    })

})


app.listen(3001,()=>{
    console.log("3001")
})

module.exports = app;
