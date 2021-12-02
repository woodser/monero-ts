const assert = require("assert");
const monerojs = require("../../index");
const BigInteger = monerojs.BigInteger;
const MoneroError = monerojs.MoneroError;
const MoneroUtils = monerojs.MoneroUtils;
const MoneroNetworkType = monerojs.MoneroNetworkType;
const LibraryUtils = monerojs.LibraryUtils;

/**
 * Test utilities including those implemented in WebAssembly.
 */
class TestMoneroUtils {
  
  runTests() {
    describe("TEST MONERO UTILITIES", function() {
      
      // initialize utils to test
      before(async function() {
        await LibraryUtils.loadKeysModule();
      });
      
      it("Can get integrated addresses", function() {
        let standardAddress = "7BkLzfgpZZXjmEpLokETw3D1WbRr6uURFQupdEDFFZGYRJy5E47T4EkXuWYU5B5kF34kr7bqX6fLP6y9mkz32VgS1PATHkt";
        let paymentId = "03284e41c342f036";
        let networkType = MoneroNetworkType.STAGENET;
        
        // get integrated address with randomly generated payment id
        let integratedAddress = MoneroUtils.getIntegratedAddress(networkType, standardAddress);
        assert.equal(standardAddress, integratedAddress.getStandardAddress());
        assert.equal(16, integratedAddress.getPaymentId().length);
        assert.equal(106, integratedAddress.getIntegratedAddress().length);
        
        // get integrated address with specific payment id
        integratedAddress = MoneroUtils.getIntegratedAddress(networkType, standardAddress, paymentId);
        assert.equal(standardAddress, integratedAddress.getStandardAddress());
        assert.equal(paymentId, integratedAddress.getPaymentId());
        assert.equal(106, integratedAddress.getIntegratedAddress().length);
        
        // get integrated address with invalid payment id
        try {
          MoneroUtils.getIntegratedAddress(networkType, standardAddress, "123");
          throw new Error("Getting integrated address with invalid payment id should have failed");
        } catch (err) {
          assert(err instanceof MoneroError);
          assert.equal("Invalid payment id", err.message);
        }
      });
      
      it("Can serialize heights with small numbers", function() {
        let json = { heights: [111, 222, 333] };
        let binary = MoneroUtils.jsonToBinary(json);
        assert(binary);
        let json2 = MoneroUtils.binaryToJson(binary);
        assert.deepEqual(json2, json);
      });
      
      it("Can serialize heights with big numbers", function() {
        let json = { heights: [123456, 1234567, 870987] };
        let binary = MoneroUtils.jsonToBinary(json);
        assert(binary);
        let json2 = MoneroUtils.binaryToJson(binary);
        assert.deepEqual(json2, json);
      });
      
      it("Can serialize json with text", function() {
        let json = { msg: 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' };
        let binary = MoneroUtils.jsonToBinary(json);
        assert(binary);
        let json2 = MoneroUtils.binaryToJson(binary);
        assert.deepEqual(json2, json);
      });
      
      it("Can serialize json with long text", function() {
        let json = { msg: 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' +
            'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
            'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
            'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
            'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
            'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
            'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
            'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
            'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
            'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
            'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
            'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
            'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
            'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n'};
        let binary = MoneroUtils.jsonToBinary(json);
        assert(binary);
        let json2 = MoneroUtils.binaryToJson(binary);
        assert.deepEqual(json2, json);
      });
      
      it("Can validate addresses", function() {
        
        // test mainnet primary address validation
        assert(MoneroUtils.isValidAddress("42U9v3qs5CjZEePHBZHwuSckQXebuZu299NSmVEmQ41YJZQhKcPyujyMSzpDH4VMMVSBo3U3b54JaNvQLwAjqDhKS3rvM3L", MoneroNetworkType.MAINNET));
        assert(MoneroUtils.isValidAddress("48ZxX3Y2y5s4nJ8fdz2w65TrTEp9PRsv5J8iHSShkHQcE2V31FhnWptioNst1K9oeDY4KpWZ7v8V2BZNVa4Wdky89iqmPz2", MoneroNetworkType.MAINNET));
        assert(MoneroUtils.isValidAddress("48W972Fx1SQMCHVKENnPpM7tRcL5oWMgpMCqQDbhH8UrjDFg2H9i5AQWXuU1qacJgUUCVLTsgDmZKXGz1vPLXY8QB5ypYqG", MoneroNetworkType.MAINNET));
        
        // test mainnet integrated address validation
        MoneroUtils.validateAddress("4CApvrfMgUFZEePHBZHwuSckQXebuZu299NSmVEmQ41YJZQhKcPyujyMSzpDH4VMMVSBo3U3b54JaNvQLwAjqDhKeGLQ9vfRBRKFKnBtVH", MoneroNetworkType.MAINNET);
        MoneroUtils.validateAddress("4JGdXrMXaMP4nJ8fdz2w65TrTEp9PRsv5J8iHSShkHQcE2V31FhnWptioNst1K9oeDY4KpWZ7v8V2BZNVa4Wdky8DvDyXvDZXvE9jTQwom", MoneroNetworkType.MAINNET);
        MoneroUtils.validateAddress("4JCp7q5SchvMCHVKENnPpM7tRcL5oWMgpMCqQDbhH8UrjDFg2H9i5AQWXuU1qacJgUUCVLTsgDmZKXGz1vPLXY8QFySJXARQWju8AuRN2z", MoneroNetworkType.MAINNET);
        
        // test mainnet subaddress validation
        MoneroUtils.validateAddress("891TQPrWshJVpnBR4ZMhHiHpLx1PUnMqa3ccV5TJFBbqcJa3DWhjBh2QByCv3Su7WDPTGMHmCKkiVFN2fyGJKwbM1t6G7Ea", MoneroNetworkType.MAINNET);
        MoneroUtils.validateAddress("88fyq3t8Gxn1QWMG189EufHtMHXZXkfJtJKFJXqeA4GpSiuyfjVwVyp47PeQJnD7Tc8iK8TDvvhcmEmfh8nx7Va2ToP8wAo", MoneroNetworkType.MAINNET);
        MoneroUtils.validateAddress("88hnoBiX3TPjbFaQE8RxgyBcf3DtMKZWWQMoArBjQfn37JJwtm568mPX6ipcCuGKDnLCzgjmpLSqce4aBDyapJJAFtNxUMb", MoneroNetworkType.MAINNET);
        
        // test testnet primary address validation
        MoneroUtils.validateAddress("9tUBnNCkC3UKGygHCwYvAB1FscpjUuq5e9MYJd2rXuiiTjjfVeSVjnbSG5VTnJgBgy9Y7GTLfxpZNMUwNZjGfdFr1z79eV1", MoneroNetworkType.TESTNET);
        MoneroUtils.validateAddress("9xZmQa1kYakGoHcfXeBgcsLf622NCpChcACwXxfdgY9uAa9hXSPCV9cLvUsAShfDcFKDdPzCNJ1n5cFGKw5GVM722pjuGPd", MoneroNetworkType.TESTNET);
        MoneroUtils.validateAddress("A2TXS6QFQ4wEsp8U7C2Y4B7wBtiML8aDG7mdCbRvDQmRaRNj1YSSgJE46fSzUkwgpMUCXFqscvrQuN7oKpP6eDyQ7XuYsuf", MoneroNetworkType.TESTNET);
        
        // test testnet integrated address validation
        MoneroUtils.validateAddress("A4AroB2EoJzKGygHCwYvAB1FscpjUuq5e9MYJd2rXuiiTjjfVeSVjnbSG5VTnJgBgy9Y7GTLfxpZNMUwNZjGfdFr2QY5Ba2aHhTEdQa2ra", MoneroNetworkType.TESTNET);
        MoneroUtils.validateAddress("A8GSRNqF9rGGoHcfXeBgcsLf622NCpChcACwXxfdgY9uAa9hXSPCV9cLvUsAShfDcFKDdPzCNJ1n5cFGKw5GVM723iPoCEF1Fs9BcPYxTW", MoneroNetworkType.TESTNET);
        MoneroUtils.validateAddress("ACACSuDk1LTEsp8U7C2Y4B7wBtiML8aDG7mdCbRvDQmRaRNj1YSSgJE46fSzUkwgpMUCXFqscvrQuN7oKpP6eDyQAdgDoT3UnMYKQz7SHC", MoneroNetworkType.TESTNET);
        
        // test testnet subaddress validation
        MoneroUtils.validateAddress("BgnKzHPJQDcg7xiP7bMN9MfPv9Z8ciT71iEMYnCdgBRBFETWgu9nKTr8fnzyGfU9h9gyNA8SFzYYzHfTS9KhqytSU943Nu1", MoneroNetworkType.TESTNET);
        MoneroUtils.validateAddress("BZwiuKkoNP59zgPHTxpNw3PM4DW2xiAVQJWqfFRrGyeZ7afVdQqoiJg3E2dDL3Ja8BV4ov2LEoHx9UjzF3W4ihPBSZvWwTx", MoneroNetworkType.TESTNET);
        MoneroUtils.validateAddress("Bhf1DEYrentcehUvNreLK5gxosnC2VStMXNCCs163RTxQq4jxFYvpw7LrQFmrMwWW2KsXLhMRtyho6Lq11ci3Fb246bxYmi", MoneroNetworkType.TESTNET);
        
        // test stagenet primary address validation
        MoneroUtils.validateAddress("5B8s3obCY2ETeQB3GNAGPK2zRGen5UeW1WzegSizVsmf6z5NvM2GLoN6zzk1vHyzGAAfA8pGhuYAeCFZjHAp59jRVQkunGS", MoneroNetworkType.STAGENET);
        MoneroUtils.validateAddress("57VfotUbSZLG82UkKhWXDjS5ZEK9ZCDcmjdk4gpVq2fbKdEgwRCFrGTLZ2MMdSHphRWJDWVBi5qS8T7dz13JTCWtC228zyn", MoneroNetworkType.STAGENET);
        MoneroUtils.validateAddress("52FysgWJYmAG73QUQZRULJj2Dv2C2mceUMB5zHqNzMn8WBtfPWQrSUFSQUKTX9r7bUMmVSGbrau976xYLynR8jTWLdA7rfp", MoneroNetworkType.STAGENET);
        
        // test stagenet integrated address validation
        MoneroUtils.validateAddress("5LqY4cQh9HkTeQB3GNAGPK2zRGen5UeW1WzegSizVsmf6z5NvM2GLoN6zzk1vHyzGAAfA8pGhuYAeCFZjHAp59jRj6LZRFrjuGK8Whthg2", MoneroNetworkType.STAGENET);
        MoneroUtils.validateAddress("5HCLphJ63prG82UkKhWXDjS5ZEK9ZCDcmjdk4gpVq2fbKdEgwRCFrGTLZ2MMdSHphRWJDWVBi5qS8T7dz13JTCWtHETX8zcUhDjVKcynf6", MoneroNetworkType.STAGENET);
        MoneroUtils.validateAddress("5BxetVKoA2gG73QUQZRULJj2Dv2C2mceUMB5zHqNzMn8WBtfPWQrSUFSQUKTX9r7bUMmVSGbrau976xYLynR8jTWVwQwpHNg5fCLgtA2Dv", MoneroNetworkType.STAGENET);
        
        // test stagenet subaddress validation
        MoneroUtils.validateAddress("778B5D2JmMh5TJVWFbygJR15dvio5Z5B24hfSrWDzeroM8j8Lqc9sMoFE6324xg2ReaAZqHJkgfGFRugRmYHugHZ4f17Gxo", MoneroNetworkType.STAGENET);
        MoneroUtils.validateAddress("73U97wGEH9RCVUf6bopo45jSgoqjMzz4mTUsvWs5EusmYAmFcBYFm7wKMVmgtVKCBhMQqXrcMbHvwck2md63jMZSFJxUhQ2", MoneroNetworkType.STAGENET);
        MoneroUtils.validateAddress("747wPpaPKrjDPZrF48jAfz9pRRUHLMCWfYu2UanP4ZfTG8NrmYrSEWNW8gYoadU8hTiwBjV14e6DLaC5xfhyEpX5154aMm6", MoneroNetworkType.STAGENET);
        
        // test invalid addresses on mainnet
        testInvalidAddress(null, MoneroNetworkType.MAINNET);
        testInvalidAddress("", MoneroNetworkType.MAINNET);
        testInvalidAddress("42ZxX3Y2y5s4nJ8fdz2w65TrTEp9PRsv5J8iHSShkHQcE2V31FhnWptioNst1K9oeDY4KpWZ7v8V2BZNVa4Wdky89iqmPz2", MoneroNetworkType.MAINNET);
        testInvalidAddress("41ApvrfMgUFZEePHBZHwuSckQXebuZu299NSmVEmQ41YJZQhKcPyujyMSzpDH4VMMVSBo3U3b54JaNvQLwAjqDhKeGLQ9vfRBRKFKnBtVH", MoneroNetworkType.MAINNET);
        testInvalidAddress("81fyq3t8Gxn1QWMG189EufHtMHXZXkfJtJKFJXqeA4GpSiuyfjVwVyp47PeQJnD7Tc8iK8TDvvhcmEmfh8nx7Va2ToP8wAo", MoneroNetworkType.MAINNET);
        
        // test invalid addresses on testnet
        testInvalidAddress(null, MoneroNetworkType.TESTNET);
        testInvalidAddress("", MoneroNetworkType.TESTNET);
        testInvalidAddress("91UBnNCkC3UKGygHCwYvAB1FscpjUuq5e9MYJd2rXuiiTjjfVeSVjnbSG5VTnJgBgy9Y7GTLfxpZNMUwNZjGfdFr1z79eV1", MoneroNetworkType.TESTNET);
        testInvalidAddress("A1AroB2EoJzKGygHCwYvAB1FscpjUuq5e9MYJd2rXuiiTjjfVeSVjnbSG5VTnJgBgy9Y7GTLfxpZNMUwNZjGfdFr2QY5Ba2aHhTEdQa2ra", MoneroNetworkType.TESTNET);
        testInvalidAddress("B1nKzHPJQDcg7xiP7bMN9MfPv9Z8ciT71iEMYnCdgBRBFETWgu9nKTr8fnzyGfU9h9gyNA8SFzYYzHfTS9KhqytSU943Nu1", MoneroNetworkType.TESTNET);
        
        // test invalid addresses on stagenet
        testInvalidAddress(null, MoneroNetworkType.STAGENET);
        testInvalidAddress("", MoneroNetworkType.STAGENET);
        testInvalidAddress("518s3obCY2ETeQB3GNAGPK2zRGen5UeW1WzegSizVsmf6z5NvM2GLoN6zzk1vHyzGAAfA8pGhuYAeCFZjHAp59jRVQkunGS", MoneroNetworkType.STAGENET);
        testInvalidAddress("51qY4cQh9HkTeQB3GNAGPK2zRGen5UeW1WzegSizVsmf6z5NvM2GLoN6zzk1vHyzGAAfA8pGhuYAeCFZjHAp59jRj6LZRFrjuGK8Whthg2", MoneroNetworkType.STAGENET);
        testInvalidAddress("718B5D2JmMh5TJVWFbygJR15dvio5Z5B24hfSrWDzeroM8j8Lqc9sMoFE6324xg2ReaAZqHJkgfGFRugRmYHugHZ4f17Gxo", MoneroNetworkType.STAGENET);
      });
      
      it("Can validate keys", async function() {
        
        // test private view key validation
        assert(MoneroUtils.isValidPrivateViewKey("86cf351d10894769feba29b9e201e12fb100b85bb52fc5825c864eef55c5840d"));
        testInvalidPrivateViewKey("");
        testInvalidPrivateViewKey();
        testInvalidPrivateViewKey("5B8s3obCY2ETeQB3GNAGPK2zRGen5UeW1WzegSizVsmf6z5NvM2GLoN6zzk1vHyzGAAfA8pGhuYAeCFZjHAp59jRVQkunGS");
        
        // test public view key validation
        assert(MoneroUtils.isValidPublicViewKey("99873d76ca874ff1aad676b835dd303abcb21c9911ca8a3d9130abc4544d8a0a"));
        testInvalidPublicViewKey("");
        testInvalidPublicViewKey();
        testInvalidPublicViewKey("z86cf351d10894769feba29b9e201e12fb100b85bb52fc5825c864eef55c5840d");
        
        // test private spend key validation
        assert(MoneroUtils.isValidPrivateSpendKey("e9ba887e93620ef9fafdfe0c6d3022949f1c5713cbd9ef631f18a0fb00421dee"));
        testInvalidPrivateSpendKey("");
        testInvalidPrivateSpendKey(null);
        testInvalidPrivateSpendKey("z86cf351d10894769feba29b9e201e12fb100b85bb52fc5825c864eef55c5840d");
        
        // test public spend key validation
        assert(MoneroUtils.isValidPublicSpendKey("3e48df9e9d8038dbf6f5382fac2becd8686273cda5bd87187e45dca7ec5af37b"));
        testInvalidPublicSpendKey("");
        testInvalidPublicSpendKey();
        testInvalidPublicSpendKey("z86cf351d10894769feba29b9e201e12fb100b85bb52fc5825c864eef55c5840d");
      });
      
      function testInvalidAddress(address, networkType) {
        assert(!MoneroUtils.isValidAddress(address, networkType));
        try {
          MoneroUtils.validateAddress(address, networkType);
          throw new Error("Should have thrown exception");
        } catch (err) {
          assert.notEqual("Should have thrown exception", err.message);
          assert(err.message);
        }
      }
      
      function testInvalidPrivateViewKey(privateViewKey) {
        assert(!MoneroUtils.isValidPrivateViewKey(privateViewKey));
        try {
          MoneroUtils.validatePrivateViewKey(privateViewKey);
          fail("Should have thrown exception");
        } catch (e) {
          assert(e.message.length > 0);
        }
      }
      
      function testInvalidPublicViewKey(publicViewKey) {
        assert(!MoneroUtils.isValidPublicViewKey(publicViewKey));
        try {
          MoneroUtils.validatePublicViewKey(publicViewKey);
          fail("Should have thrown exception");
        } catch (e) {
          assert(e.message.length > 0);
        }
      }
      
      function testInvalidPrivateSpendKey(privateSpendKey) {
        assert(!MoneroUtils.isValidPrivateSpendKey(privateSpendKey));
        try {
          MoneroUtils.validatePrivateSpendKey(privateSpendKey);
          fail("Should have thrown exception");
        } catch (e) {
          assert(e.message.length > 0);
        }
      }
      
      function testInvalidPublicSpendKey(publicSpendKey) {
        assert(!MoneroUtils.isValidPublicSpendKey(publicSpendKey));
        try {
          MoneroUtils.validatePublicSpendKey(publicSpendKey);
          fail("Should have thrown exception");
        } catch (e) {
          assert(e.message.length > 0);
        }
      }
      
      it("Can convert between XMR and atomic units", function() {
        assert.equal(MoneroUtils.xmrToAtomicUnits(1).toString(), new BigInteger("1000000000000").toString());
        assert.equal(MoneroUtils.atomicUnitsToXmr(new BigInteger("1000000000000")), 1);
        assert.equal(MoneroUtils.xmrToAtomicUnits(0.001).toString(), new BigInteger("1000000000").toString());
        assert.equal(MoneroUtils.atomicUnitsToXmr(new BigInteger("1000000000")), .001);
        assert.equal(MoneroUtils.xmrToAtomicUnits(.25).toString(), new BigInteger("250000000000").toString());
        assert.equal(MoneroUtils.atomicUnitsToXmr(new BigInteger("250000000000")), .25);
        assert.equal(MoneroUtils.xmrToAtomicUnits(1.25).toString(), new BigInteger("1250000000000").toString());
        assert.equal(MoneroUtils.atomicUnitsToXmr(new BigInteger("1250000000000")), 1.25);
        assert.equal(MoneroUtils.xmrToAtomicUnits("1").toString(), new BigInteger("1000000000000").toString());
        assert.equal(MoneroUtils.atomicUnitsToXmr(new BigInteger("1000000000000")), 1);
        assert.equal(MoneroUtils.xmrToAtomicUnits("0.001").toString(), new BigInteger("1000000000").toString());
        assert.equal(MoneroUtils.atomicUnitsToXmr(new BigInteger("1000000000")), .001);
        assert.equal(MoneroUtils.xmrToAtomicUnits(".25").toString(), new BigInteger("250000000000").toString());
        assert.equal(MoneroUtils.atomicUnitsToXmr(new BigInteger("250000000000")), .25);
        assert.equal(MoneroUtils.xmrToAtomicUnits("1.25").toString(), new BigInteger("1250000000000").toString());
        assert.equal(MoneroUtils.atomicUnitsToXmr(new BigInteger("1250000000000")), 1.25);
      });
    })
  }
}

module.exports = TestMoneroUtils;