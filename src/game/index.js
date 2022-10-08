const drawBoard = document.getElementById('drawBoard');
const ctx = drawBoard.getContext('2d');
ctx.fillStyle="black"

let mode = true;
let draw = false;

const nn = new NeuralNetwork(100, 32, 4);

window.addEventListener('DOMContentLoaded', async () => {
     
    const res = await fetch('http://localhost:3000/nn/data')

    if(res.status === 204) return;

    const data = await res.json();

    if(data?.IH === undefined) return;

    nn.weights_IH = math.matrix(data.IH);
    nn.weights_HO = math.matrix(data.HO);
    nn.bias_HO = data.bias_HO;
    nn.bias_IH = data.bias_IH;
})



drawBoard.addEventListener('mousedown', (e) => {

    const x = Math.floor((e.clientX - drawBoard.getBoundingClientRect().x) / 30)
    const y = Math.floor((e.clientY - drawBoard.getBoundingClientRect().y) / 30)

    mode ? ctx.fillStyle="black" : ctx.fillStyle="white"

    ctx.fillRect(x * 30, y * 15, 30, 15)

    draw = true;
})

drawBoard.addEventListener('mousemove', (e) => {
    if(!draw) return;

    const x = Math.floor((e.clientX - drawBoard.getBoundingClientRect().x) / 30)
    const y = Math.floor((e.clientY - drawBoard.getBoundingClientRect().y) / 30)


    mode ? ctx.fillStyle="black" : ctx.fillStyle="white"

    
    ctx.fillRect(x * 30, y * 15, 30, 15)
        
})


drawBoard.addEventListener('mouseup', (e) => {
    draw = false;
})

document.querySelector('.fa-eraser').addEventListener('click', (e) => {
    if(!mode) return;
    
    drawBoard.style.border = '1px solid #f15e77b0'
    drawBoard.style.boxShadow = '0 0 3px 2px #f15e762d'
    mode = false
})

document.querySelector('.fa-trash').addEventListener('click', (e) => {
    
    ctx.fillStyle="white"

    for(let i = 0; i<10; i++)
    {
        for(let j = 0; j<10; j++)
        {
            ctx.fillRect(j * 30, i * 15, 30, 15)
        }
    }

    mode ? ctx.fillStyle="black" : ctx.fillStyle="white"
})

document.querySelector('.fa-paintbrush').addEventListener('click', (e) => {
    if(mode) return;
    
    drawBoard.style.border = '1px solid black'
    drawBoard.style.boxShadow = '0 0 3px 2px #0000002d'
    mode = true;
})




function getDoodleData()
{
    let result = []
    for(let i = 0; i<10; i++)
    {
        for(let j = 0; j<10; j++)
        {
           const imageData = ctx.getImageData(j * 30, i * 15, 1, 1).data
           result.push((imageData[3] === 255 && imageData[0] === 0) ? 1 : 0);
        }
    }

    return result;
}


document.getElementById('check').addEventListener('click', async (e) => {
    
    document.querySelector('.result').innerText = '';

    const response = await fetch(`http://localhost:3000/nn/doodles`);
    const doodles = await response.json()  

    let keys = Object.keys(doodles)

    const result = getDoodleData();

    const nn_result = nn.forwardPropagation(result);

    let prediction = -100
    let name = ''

    for(let i = 0; i<nn_result[1].length; i++)
    {
        if(prediction < nn_result[1][i]) {
            prediction = nn_result[1][i]
            name = keys[i]
        }
    }

    document.querySelector('.result').innerText = `It is a ${name}`;
})

document.getElementById('save').addEventListener('click', async (e) => {
    
    if(document.getElementById('doodlename').value.trim().length === 0) return;
    
    const result = getDoodleData();


    await fetch(`http://localhost:3000/nn/doodle/${document.getElementById('doodlename').value}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(result)
    })
})

document.getElementById('learn').addEventListener('click', async (e) => {

    //Get doodles
    const response = await fetch(`http://localhost:3000/nn/doodles`);

    const doodles = await response.json()  

    let short = []
    let inputs = []
    for(let i = 0; i<25000; i++)
    {
        let keys = Object.keys(doodles);

        for(let j = 0; j<keys.length; j++)
        {
            inputs.push({ name: keys[j], data: doodles[keys[j]], index: j });
            
            if(i < 1)
                short.push({ name: keys[j], data: doodles[keys[j]], index: j });
        }
    }

    let counter = inputs.length - 1

    //Shuffle
    while(counter > 1) {

        let index = Math.floor(Math.random() * counter);

        let temp = inputs[index]
        inputs[index] = inputs[counter]
        inputs[counter] = temp;


        --counter;
    }

    //Train the neural network
    for(let i = 0; i<inputs.length; i++)
    {
        const guesses = nn.forwardPropagation(inputs[i].data)

        if(i % 1000 === 0) {
            console.log(i / 1000)
        }
        
        let targets = []
        for(let j = 0; j<nn.n_outputs; j++)
            targets.push(0)
         
        targets[inputs[i].index] = 1;

        nn.backPropagation(inputs[i].data, guesses, targets)
    }

    //Store data in the server
    await fetch('http://localhost:3000/nn/data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({IH: nn.weights_IH, HO: nn.weights_HO, bias_HO: nn.bias_HO, bias_IH: nn.bias_IH })
    })
})
