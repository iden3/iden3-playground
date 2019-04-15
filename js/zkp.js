

// circom multiplier.circom -o multiplier.json
// snarkjs setup -c multiplier.json
// snarkjs calculatewitness -c multiplier.json
// snarkjs proof
// snarkjs verify

const protocol = "groth"; // groth

function loadCircuit() {
	let circuitStr = document.getElementById("inputCircuit").value;
	console.log(circuitStr);

	circom("", circuitStr).then( (cir) => {
		console.log(cir);
			toastr.success("Circuit compiled");
			document.getElementById("compiledCircuitOutput").innerHTML = JSON.stringify(cir);
	}, (err) => {
			console.error(err);
			toastr.error("error compiling circuit: " + err);
	});
}

function calculateSetup() {
	let circuitStr = document.getElementById("compiledCircuitOutput").value;
	let cirDef = JSON.parse(circuitStr);
	let cir = new snarkjs.Circuit(cirDef);

        if (!snarkjs[protocol]) throw new Error("Invalid protocol");
        const setup = snarkjs[protocol].setup(cir);

	document.getElementById("provingKeyOutput").innerHTML = JSON.stringify(snarkjs.stringifyBigInts(setup.vk_proof));
	document.getElementById("verificationKeyOutput").innerHTML = JSON.stringify(snarkjs.stringifyBigInts(setup.vk_verifier));
	toastr.success("Setup done");
}

function calculateWitness() {
	let circuitStr = document.getElementById("compiledCircuitOutput").value;
	let cirDef = JSON.parse(circuitStr);
	let cir = new snarkjs.Circuit(cirDef);

	let provingKey = snarkjs.unstringifyBigInts(JSON.parse(document.getElementById("provingKeyOutput").innerHTML));
	let verificationKey = snarkjs.unstringifyBigInts(JSON.parse(document.getElementById("verificationKeyOutput").innerHTML));

	let inputs = snarkjs.unstringifyBigInts(JSON.parse(document.getElementById("circuitInputs").value));

  const witness = cir.calculateWitness(inputs);
	document.getElementById("witnessOutput").innerHTML = snarkjs.stringifyBigInts(JSON.stringify(witness));
	toastr.success("witness calculated");
}

function generateProof() {
	let witness = snarkjs.unstringifyBigInts(JSON.parse(document.getElementById("witnessOutput").value));
	let provingKey = snarkjs.unstringifyBigInts(JSON.parse(document.getElementById("provingKeyOutput").value));

	const protocol = provingKey.protocol;
	if (!snarkjs[protocol]) throw new Error("Invalid protocol");
	const {proof, publicSignals} = snarkjs[protocol].genProof(provingKey, witness);

	document.getElementById("proofOutput").innerHTML = JSON.stringify(snarkjs.stringifyBigInts(proof));
	document.getElementById("publicSignals").innerHTML = JSON.stringify(snarkjs.stringifyBigInts(publicSignals));
	toastr.success("snark proof generated");
}

function verifyProof() {
	let public = snarkjs.unstringifyBigInts(JSON.parse(document.getElementById("publicSignals").value));
	let verificationKey = snarkjs.unstringifyBigInts(JSON.parse(document.getElementById("verificationKeyOutput").value));
	let proof = snarkjs.unstringifyBigInts(JSON.parse(document.getElementById("proofOutput").value));

	const protocol = verificationKey.protocol;
	if (!snarkjs[protocol]) throw new Error("Invalid protocol");

	const isValid = snarkjs[protocol].isValid(verificationKey, proof, public);

	if (isValid) {
			console.log("snark verification passed");
			toastr.success("snark verification passed");
			document.getElementById("zkverifiedresult").innerHTML = `
			<div class="o_green" style="padding: 10px;">
				✔ zkSnark verified
			</div>
			`;
	} else {
			console.error("snark verification error");
			toastr.error("snark verification error");
			document.getElementById("zkverifiedresult").innerHTML = `
			<div class="o_red" style="padding: 10px;">
				❌ zkSnark verification error
			</div>
			`;
	}
}
