    const loginUrl = 'http://localhost:9000';
    const login = await axiosGetDebug(`${loginUrl}/login`);
    const sigReq = login.data.sigReq;

    const date = new Date();
    const unixtime = Math.round((date).getTime() / 1000);
    const expirationTime = unixtime + 60;
    const signedPacket = iden3.protocols.login.signIdenAssertV01(sigReq, id.idAddr, `${name}@iden3.io`, proofEthName.proofAssignName, kc, ksign, proofKSign, expirationTime);

    const token = await axiosPostDebug(`${loginUrl}/login`, {jws: signedPacket});
    console.log("expire:", token.data.expire);
    console.log("token:", token.data.token);

    const hello = await axiosGetDebug(`${loginUrl}/auth/hello`, { headers: { Authorization: `Bearer ${token.data.token}` } });
    console.log("hello:", hello.data);
