require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const app = express();
const Person = require('./models/person');

app.use(express.static('build'));
app.use(cors());
app.use(express.json());

morgan.token('post-data', (req) => {
  if (req.method === 'POST' || req.method === 'PUT')
    return JSON.stringify(req.body);
  return '';
});

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :post-data'));

app.get('/info', (req, res) => {
  Person.find({})
    .then(people => {
      const time = new Date();
      return res.send(`<p>Phonebook has info for ${people.length} people</p><p>${time}</p>`);
    });
});

app.get('/api/persons', (request, response) => {
  Person.find({}).then(people => {
    response.send(people);
  });
});

app.post('/api/persons', (request, response, next) => {
  const body = request.body;


  Person.find({ name: body.name }).then((people) => {
    if (people.length > 0)
      return response.status(400).json({
        error: 'name must be unique'
      });
    else {
      const person = new Person({
        name: body.name,
        number: body.number || ''
      });

      person.save()
        .then(savedPerson => response.json(savedPerson))
        .catch(error => next(error));
    }
  });
});

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person);
      } else {
        response.status(404).end();
      }
    })
    .catch(error => next(error));
});

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body;

  const person = {
    name: body.name,
    number: body.number,
  };

  Person.findByIdAndUpdate(
    request.params.id,
    person,
    { new: true, runValidators: true, context: 'query' }
  )
    .then(updatedPerson => {
      response.json(updatedPerson);
    })
    .catch(error => next(error));
});

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(() => {
      response.status(204).end();
    })
    .catch(error => next(error));
});

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' });
};

// handler of requests with unknown endpoint
app.use(unknownEndpoint);

const errorHandler = (error, request, response, next) => {
  console.error(error.message);
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' });
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message });
  }

  next(error);
};

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
