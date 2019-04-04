

// circom multiplier.circom -o multiplier.json
// snarkjs setup -c multiplier.json
// snarkjs calculatewitness -c multiplier.json
// snarkjs proof
// snarkjs verify


function calculateSetup() {
	let circuitStr = document.getElementById("compiledCircuitOutput").innerHTML;
	let cirDef = JSON.parse(circuitStr);
	let cir = new zkSnark.Circuit(cirDef);

        if (!zkSnark[protocol]) throw new Error("Invalid protocol");
        const setup = zkSnark[protocol].setup(cir);

	document.getElementById("provingKeyOutput").innerHTML = JSON.stringify(setup.vk_proof);
	document.getElementById("verificationKeyOutput").innerHTML = JSON.stringify(setup.vk_verifier);
	toastr.info("Setup done");
}

function calculateWitness() {
	let circuitStr = document.getElementById("compiledCircuitOutput").innerHTML;
	let cirDef = JSON.parse(circuitStr);
	let cir = new zkSnark.Circuit(cirDef);

	let provingKey = document.getElementById("provingKeyOutput").innerHTML;
	let verificationKey = document.getElementById("verificationKeyOutput").innerHTML;

	let inputs = document.getElementById("circuitInputs").innerHTML;

        const witness = cir.calculateWitness(input);
	
}
