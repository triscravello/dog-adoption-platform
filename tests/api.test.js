process.env.NODE_ENV = 'test';
const mongoose = require('mongoose');
const chai = require('chai');
const chaiHttp = require('chai-http');
const request = require('supertest');
const app = require('../app');
const User = require('../models/User')
const Dog = require('../models/Dog');
const Adoption = require('../models/Adoption');

chai.use(chaiHttp);
const { expect } = chai;

describe('Dog Adoption API', function () {
    let server;
    let authTokenUserA;
    let authTokenUserB;
    let userA;
    let userB;
    let dogId;

    before(async function() {
        // connect to DB - assumes MONGODB_URI points to a test DB
        await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        await User.deleteMany();
        await Dog.deleteMany();
        await Adoption.deleteMany();
    });

    after(async function() {
        await mongoose.connect.close();
    });

    it('registers user A', async function() {
        const res = await request(app)
            .post('/auth/register')
            .send({ username: 'userA', password: 'passA' })
            .expect(201);
        expect(res.body).to.have.property('token');
        authTokenUserA = res.body.token;
        userA = res.body.user;
    });

    it('registers user B', async function () {
        const res = await request(app)
            .post('/auth/register')
            .send({ username: 'userB', password: 'passB' })
            .expect(201);
        authTokenUserB = res.body.token;
        userB = res.body.user;
    });

    it('user A registers a dog', async function () {
        const res = await request(app)
            .post('/dogs')
            .set('Authorization', `Bearer ${authTokenUserA}`)
            .send({ name: 'Rover', description: 'Friendly pup' })
            .expect(201);
        expect(res.body.dog).to.have.property('_id');
        dogId = res.body.dog._id;
        expect(res.body.dog.owner).to.equal(userA._id);
    });

    it('user A cannot adopt their own dog', async function () {
        const res = await request (app)
            .post(`/dog/${dogId}/adopt`)
            .set('Authorization', `Bearer ${authTokenUserA}`)
            .send({ thankYouMessage: 'I love you' })
            .expect(403);
        expect(res.body.error).to.match(/cannot adopt/i);
    });

    it('user B adopts the dog', async function () {
        const res = await request (app)
            .post(`/dogs/${dogId}/adopt`)
            .set('Authorization', `Bearer ${authTokenUserB}`)
            .send({ thankYouMessage: 'Thanks for Rover!' })
            .expect(200);
        expect(res.body.dog.status).to.equal('adopted');
        expect(res.body.dog.adopter).to.equal(userB._id);
    })

    it('user A cannot remove an adopted dog', async function () {
        const res = await request (app)
            .delete(`/dogs/${dogId}`)
            .set('Authorization', `Bearer ${authTokenUserA}`)
            .expect(400);
        expect(res.body.error).to.match(/Cannot remove/i);
    });

    it('user B lists adopted dogs', async function () {
        const res = await request (app)
            .get('/dogs/adopted')
            .set('Authorization', `Bearer ${authTokenUserB}`)
            .expect(200);
        expect(res.body.total).to.equal(1);
        expect(res.body.dogs[0]._id).to.equal(dogId);
    });
});