const models = require('../models');
const {caver, incidents, incident, keystore, password} = require('../library/caver');
const jobQueue = require('../library/jobQueue');
const Op = models.Sequelize.Op;

exports.writeProgress =  async function(req, res) {
    var incidentId = parseInt(req.params.id);

    var result = await models.Incidents.findByPk(incidentId);
    var incident = JSON.parse(JSON.stringify(result));
    var contractAddr = incident['contract'];

    models.Progresses.create({
        content: req.body['content'],
        userId: req.body['userId'], 
        IncidentId: incidentId
    })
    .then((result) => { res.json(result); })
    .catch(console.log);

    jobQueue.addJobProgress(contractAddr, JSON.stringify(req.body));
};

exports.progressList = function(req, res) {
    var incidentId = parseInt(req.params.id);
    var userId = req.body['userId'];
    var size = req.query.size || 5;
    var sortBy = req.query.sortBy || 'updatedAt';
    var order = req.query.order || 'DESC';
    var before = req.query.before;
    var after = req.query.after;

    if (before) {
        models.Progresses.findAll({
            where: {
                IncidentId: incidentId,
                updatedAt: {
                    [Op.lt]: before 
                }
            },
            order: [[sortBy, order]],
            limit: size
        })
        .then((progresses) => { res.json(progresses); })
        .catch(console.log);
    } else if (after) {
        models.Progresses.findAll({
            where: {
                IncidentId: incidentId,
                updatedAt: {
                    [Op.gt]: after 
                }
            },
            order: [[sortBy, order]],
            limit: size
        })
        .then((progresses) => { res.json(progresses); })
        .catch(console.log);
    } else {
        models.Progresses.findAll({
            where: {IncidentId: incidentId},
            order: [[sortBy, order]],
            limit: size
        })
        .then((progresses) => { res.json(progresses); })
        .catch(console.log);
    }
};

exports.addProgress = function(contractAddr, content, done) {
    var incidentContract = new caver.klay.Contract(incidents.abi, contractAddr);
    incidentContract.options.address = keystore['address'];

    caver.klay.unlockAccount(keystore['address'], password)
    .then(() => {
        incidentContract.methods.addProgress(content)
        .send({
            from: keystore['address'],
            gasPrice: 0, gas: 999999999999 })
        .then(()=>{ 
            caver.klay.lockAccount(keystore['address']); 
            done();
        })
        .catch((error) => {
            console.log(error);
            done(new Error("addComment call error"));
        });
    })
    .catch((error) => {
        console.log(error);
        done(new Error("unlock error"));
    });
}