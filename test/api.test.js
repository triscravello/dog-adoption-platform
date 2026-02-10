process.env.NODE_ENV = 'test';
const mongoose = require('mongoose');
const chai = require('chai');
const request = require('supertest');
const app = require('../app');
const User = require('../models/User')
const Dog = require('../models/Dog');
const Adoption = require('../models/Adoption');

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
        await mongoose.connection.close();
    });

    it('registers user A', async function() {
        const res = await request(app)
            .post('/auth/register')
            .send({ username: 'userA', password: 'passA123' })
            .expect(201);
        expect(res.body).to.have.property('token');
        authTokenUserA = res.body.token;
        userA = res.body.user;
    });

    it('registers user B', async function () {
        const res = await request(app)
            .post('/auth/register')
            .send({ username: 'userB', password: 'passB123' })
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
            .post(`/dogs/${dogId}/adopt`)
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
        expect(res.body.adoptedDogs).to.be.an('array');
        expect(res.body.adoptedDogs[0]._id.toString()).to.equal(dogId.toString());
    });
});

describe('Dog Adoption API - Edge Cases', function () {
    let authTokenUserA;
    let authTokenUserB;
    let userA;
    let userB;
    let dogId;

    before(async function() {
        await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        await User.deleteMany();
        await Dog.deleteMany();
        await Adoption.deleteMany();

        // Register users
        const resA = await request(app).post('/auth/register').send({ username: 'userA', password: 'passA123' });
        authTokenUserA = resA.body.token;
        userA = resA.body.user;

        const resB = await request(app).post('/auth/register').send({ username: 'userB', password: 'passB123' });
        authTokenUserB = resB.body.token;
        userB = resB.body.user;

        // User A creates a dog
        const dogRes = await request(app)
            .post('/dogs')
            .set('Authorization', `Bearer ${authTokenUserA}`)
            .send({ name: 'EdgeCaseDog', description: 'Fresh dog' });
        dogId = dogRes.body.dog._id;
    });

    after(async function () {
        await mongoose.connection.close();
    });

    it('should not allow adoption a non-existent dog', async function () {
        const fakeDogId = '000000000000000000000000'; // valid ObjectId format, but doesn't exist
        const res = await request(app)
            .post(`/dogs/${fakeDogId}/adopt`)
            .set('Authorization', `Bearer ${authTokenUserB}`)
            .send({ thankYouMessage: 'I want a ghost dog!' })
            .expect(404);
        expect(res.body.error).to.match(/not found/i);
    });

    it('should allow user B to adopt the dog', async function () {
        const res = await request(app)
            .post(`/dogs/${dogId}/adopt`)
            .set('Authorization', `Bearer ${authTokenUserB}`)
            .send({ thankYouMessage: 'Thanks Rover!' })
            .expect(200);
        expect(res.body.dog.status).to.equal('adopted');
        expect(res.body.dog.adopter.toString()).to.equal(userB._id.toString());
    });

    it('should not allow adopting an already adopted dog', async function () {
        const res = await request(app)
            .post(`/dogs/${dogId}/adopt`)
            .set('Authorization', `Bearer ${authTokenUserA}`)
            .send({ thankYouMessage: 'Trying to adopt again' })
            .expect(400);
        expect(res.body.error).to.match(/not available/i);
    });

    it('should not allow owner to remove an adopted dog', async function () {
        const res = await request(app)
            .delete(`/dogs/${dogId}`)
            .set('Authorization', `Bearer ${authTokenUserA}`)
            .expect(400)
        expect(res.body.error).to.match(/cannot remove/i);
    });

});