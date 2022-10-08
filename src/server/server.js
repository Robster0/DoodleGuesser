const MuxJS = require('muxjs-http');
const fs = require('fs');


MuxJS.ListenAndServe(3000, (err) => {
    if(err) return console.log(err);



    console.log("Starting server at port " + MuxJS.Port)
})

MuxJS.CORS({
    origin: 'http://localhost:5500',
    credentials: true,
    methods: "GET, POST, OPTIONS"
})


MuxJS.PreFlight((w, r) => {

    w.SetHeaders({
        'Access-Control-Allow-Headers': '*'
    })

    w.SendStatus(200)
})



const r = MuxJS.NewRouter().PathPrefix('/nn');


r.HandleFunc('/data', getData).Method('GET');


r.HandleFunc('/doodles', getDoodleData).Method('GET');


r.HandleFunc('/data', saveData).Method('POST');

r.HandleFunc('/doodle/{name}', handleDoodleData).Method('POST');



function getData(w, r) {
    try
    {
        const data = fs.readFileSync('./assets/data.json');
        const nn_data =  JSON.parse(data)
     
        w.SendJSON({
            IH: nn_data.IH,
            HO: nn_data.HO,
            bias_IH: nn_data.bias_IH,
            bias_HO: nn_data.bias_HO
        });
    }
    catch(err)
    {
        w.SendStatus(204)
    }
}

function saveData(w, r) {

    fs.writeFileSync('./assets/data.json', JSON.stringify({
        IH: r.Body.IH.data,
        HO: r.Body.HO.data,
        bias_IH: r.Body.bias_IH,
        bias_HO: r.Body.bias_HO
    }));

    w.SendStatus(201)
}

function handleDoodleData(w, r) {

    const data = fs.readFileSync('./assets/doodles.json')

    const doodles = JSON.parse(data)

    doodles[r.Params.name] = r.Body;

    fs.writeFileSync('./assets/doodles.json', JSON.stringify(doodles));

    w.SendStatus(201);
}


function getDoodleData(w, r) {

    const data = fs.readFileSync('./assets/doodles.json')

    const doodles = JSON.parse(data);

    w.SendJSON(doodles);       
}
