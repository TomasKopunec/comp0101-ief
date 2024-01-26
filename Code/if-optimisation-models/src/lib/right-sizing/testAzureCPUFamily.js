const { CPUDatabase } = require('./azureCPUFamily'); 

async function testCPUDatabase() {
    const db = new CPUDatabase();

    await db.loadModelData('azure-instances.json');

    const testModels = ['Standard_B2pts v2', 'F2s v2', 'NonExistentModel'];
    testModels.forEach(modelName => {
        const family = db.getModelFamily(modelName);
        if (family) {
            console.log(`Family for ${modelName}:`);
            family.forEach(cpu => {
                console.log(`Model: ${cpu.model}, vCPUs: ${cpu.vCPUs}`);
            });
        } else {
            console.log(`Model ${modelName} not found in any family.`);
        }
    });
}

testCPUDatabase().catch(console.error);
