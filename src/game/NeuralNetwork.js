function generateWeights(x, y)
{
   let arr = [];

   for(let i = 0; i<x; i++)
   {
      arr[i] = [];
      for(let j = 0; j<y; j++)
      {
          arr[i][j] = j % 2 === 0 ? -(1/Math.sqrt(y)) : (1/Math.sqrt(y))
      }
   }
   return arr;
}

function generateBias(n)
{
   let bias = [];
   for(let i = 0; i<n; i++)
     bias.push(0);
   
     return bias;
}

class NeuralNetwork
{
    constructor(inputs, hidden, outputs)
    {
        this.n_hidden = hidden;
        this.n_inputs = inputs;
        this.n_outputs = outputs;

        this.weights_IH = math.matrix(generateWeights(this.n_hidden, this.n_inputs));
        this.weights_HO = math.matrix(generateWeights(this.n_outputs, this.n_hidden));


        this.bias_IH = generateBias(this.n_hidden);
        this.bias_HO = generateBias(this.n_outputs);

        this.lr = 0.1;
    }

    forwardPropagation(inputs)
    {
       let sums_IH = [];
            
       for(let i = 0; i<this.n_hidden; i++)
       {
           let sum = 0;
           for(let j = 0; j<this.n_inputs; j++)
           {
               sum += (this.weights_IH._data[i][j] * inputs[j]) + this.bias_IH[i];
           }

           sums_IH.push(this.Sigmoid(sum));
       }
       
       let sums_HO = [];
       for(let i = 0; i<this.n_outputs; i++)
       {
           let sum = 0;
           for(let j = 0; j<this.n_hidden; j++)
           {
              sum += (this.weights_HO._data[i][j] * sums_IH[j]) + this.bias_HO[i];
           }

           sums_HO.push(this.Sigmoid(sum));
       }

       
       return [sums_IH, sums_HO];
    }

    backPropagation(inputs, guesses, targets)
    {

       let [guesses_IH, guesses_HO] = guesses;
       //Output errorsd which will be calculates from the current output results from the forward propagation algorithm
       let errors_HO = [];
       //These errorsd are calculated through the specific target (wanted result) - the guesses we got from the forward propagation
       
       for(let i = 0; i<guesses_HO.length; i++) {
        errors_HO.push((Array.isArray(targets) ? targets[i] : targets) - guesses_HO[i])

       }
        
       
           
       
               
       //Transposing the weights from hidden to output (switching the rows and the columns), I do this because for example 5 hidden layers and 3 outputs, this will create an 2d array with the dimensions [3, 5]
       //since its 5 weights which goes into 3 different outputs meanings 3 arrays with 5 values inside but if we do reverse and need to go back then its an 2d array with the dimensions
       //[5, 3] since now all the results from the output layer (after error calc) (3) needs to go into every hidden layer (5) meaning its 5 arrays with 3 values each
       let transposed_HO = math.transpose(this.weights_HO);

       let errors_IH = math.multiply(transposed_HO, errors_HO);  
 
      //Calculation of the new weights through the formula of -> learning rate * current errors * sigmoid`(x) * previous input layer
      this.weights_HO = this.calculateGradient(math.matrix(errors_HO), guesses_HO, guesses_IH, this.weights_HO); 


      this.weights_IH = this.calculateGradient(errors_IH, guesses_IH, inputs, this.weights_IH)
    }

    calculateGradient(errors, sigmoided, input, v)
    {
      // lr * errors_HO * S`(x) * guesses_IH eller  lr * errors_IH * S`(x) * inputs
      let gradient = []
      for(let i = 0; i<math.size(errors)._data[0]; i++)
      {       
        //console.log(errors._data[i])
        gradient.push( (errors._data[i] * (sigmoided[i] * (1 - sigmoided[i]))) * this.lr);
        if(v == this.weights_HO)
        this.bias_HO[i] += gradient[i]
        else
        this.bias_IH[i] += gradient[i]
      }

      //console.log(math.size(errors)._data[0])
      //console.log("input: " +input.length)
      //Lägger till den sista delen på gradient
      for(let i = 0; i<gradient.length; i++)
      {
        let sum = 0;
        for(let j = 0; j<input.length; j++)
        {
           sum += gradient[i] * input[j];
        }
        gradient[i] = sum;
      }

      //console.table(gradient);
      //Trycker på gradient till the weights mellan hidden och output, måste tyvärr göra en for loop här för att mathjs är en bitch
      let evaluation = [];
      for(let i = 0; i<gradient.length; i++)
      {
          evaluation[i] = [];       
          for(let j = 0; j<math.size(v)._data[1]; j++)
          {
              evaluation[i][j] = v._data[i][j] + gradient[i]; 
          }
      }

      //console.table(evaluation);
      
      return math.matrix(evaluation);
    }

      
    Sigmoid(x)
    {
        return 1 / (1 + Math.pow(Math.E, -x));
    }
}
