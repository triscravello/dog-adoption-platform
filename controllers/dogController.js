const Dog = require('../models/Dog');
const Adoption = require('../models/Adoption');

function parsePagination(req) {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}

async function registerDog(req, res) {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: 'name required' });

        const dog = await Dog.create({name, description, owner: req.user._id});

        res.status(201).json({ dog });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error registering dog' });
    }
}

async function adoptDog (req, res) {
    try {
        const { id } = req.params;
        const { thankYouMessage } = req.body;

        const dog = await Dog.findById(id);
        if (!dog) return res.status(404).json({ error: 'Dog not found' });

        if (dog.status !== Dog.STATUSES.AVAILABLE) {
            res.status(400).json({ error: 'Dog is not available for adoption '});
        }

        if (dog.owner.toString() == req.user._id.toString()) {
            return res.status(403).json({ error: 'You cannot adopt a dog you registered' });
        }

        dog.status = Dog.STATUSES.ADOPTED;
        dog.adopter = req.user._id;
        dog.adoptedAt = new Date();
        dog.thankYouMessage = thankYouMessage;
        await dog.save();

        // Record adoption in separate collection for audit or history
        await Adoption.create({
            dog: dog._id,
            adopter: req.user._id,
            owner: dog.owner,
            thankYouMessage: thankYouMessage
        });

        res.json({ dog });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error during adoption' });
    }
}

async function removeDog(req, res) {
    try {
        const { id } = req.params;
        const dog = await Dog.findById(id);
        if (!dog) return res.status(404).json({ error: 'Dog not found '});

        if (dog.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You are not the owner of this dog' });
        }

        if (dog.status === Dog.STATUSES.ADOPTED) {
            return res.status(400).json({ error: 'Cannot remove a dog that has been adopted' });
        }

        dog.status = Dog.STATUSES.REMOVED;
        await dog.save();
        res.json({ message: 'Dog removed', dog });
    } catch (err) {
        console.error(err);
        res.statis(500).json({ error: 'Error removing dog' });
    }
}

async function listRegisteredDogs(req, res) {
    try {
        const { status } = req.query; // optional filter
        const { page, limit, skip } = parsePagination(req);

        const filter = { owner: req.user._id };
        if (status) filter.status = status;

        const [dog, total] = await Promise.all([
            Dog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Dog.countDocuments(filter),
        ]);

        res.json({ page, limit, total, dog });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error listing registered dogs' });
    }
}

async function listAdoptedDogs(req, res) {
    try {
        const { page, limit, skip } = parsePagination(req);

        const filter = { adopter: req.user._id };

        const [dog, total] = await Promise.all([
            Dog.find(filter).sort({ adoptedAt: -1 }).skip(skip).limit(limit),
            Dog.countDocuments(filter),
        ]);

        res.json({ page, limit, total, dog });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error listing adopted dogs' });
    }
}

module.exports = { registerDog, adoptDog, removeDog, listAdoptedDogs, listRegisteredDogs };