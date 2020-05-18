# Blocks, transactions, transfers, and outputs

The following JSON object is a serialized transaction to demonstrate the data model (blocks, transactions, transfers, and outputs) used by this library.

```json
{
	"height": 582106,
	"timestamp": 1589742946,
	"txs": [
		{
			"hash": "0b30d7b7510a1aed88c87464dffdcfe9d24feffc8798e30e887e3c9c3558a814",
			"isMinerTx": false,
			"fee": 268180000,
			"relay": true,
			"isRelayed": true,
			"isConfirmed": true,
			"numConfirmations": 5,
			"unlockTime": 0,
			"isDoubleSpendSeen": false,
			"isFailed": false,
			"isLocked": true,
			"isIncoming": true,
			"isOutgoing": true,
			"outgoingAmount": 100000,
			"incomingAmount": 100000,
			"height": 582106,
			"inTxPool": false,
			"incomingTransfers": [
				{
					"amount": 50000,
					"accountIndex": 1,
					"numSuggestedConfirmations": 1,
					"subaddressIndex": 0,
					"address": "73FUi8tkbeuBFSqhXzeMbd1WuMXJmdc3yeaGwx2f1NFaYzzypQ7a9scgn7JAtNagKPe4qCwE4S7wwB9ibJKv4RXnE8dtAva",
					"isIncoming": true,
					"isOutgoing": false
				},
				{
					"amount": 50000,
					"accountIndex": 2,
					"numSuggestedConfirmations": 1,
					"subaddressIndex": 0,
					"address": "7AnBDQp5ZMEWvwMxzNthWhNEvLsvTkYwp6dxnDmC88hqcLwqaD2cYmESAtqqJ9myXE6PLz5oqrApnUtqTW69mWevCZJUhWV",
					"isIncoming": true,
					"isOutgoing": false
				}
			],
			"outgoingTransfer": {
				"amount": 100000,
				"accountIndex": 0,
				"numSuggestedConfirmations": 1,
				"subaddressIndices": [
					0
				],
				"destinations": [
					{
						"address": "73FUi8tkbeuBFSqhXzeMbd1WuMXJmdc3yeaGwx2f1NFaYzzypQ7a9scgn7JAtNagKPe4qCwE4S7wwB9ibJKv4RXnE8dtAva",
						"amount": 50000
					},
					{
						"address": "7AnBDQp5ZMEWvwMxzNthWhNEvLsvTkYwp6dxnDmC88hqcLwqaD2cYmESAtqqJ9myXE6PLz5oqrApnUtqTW69mWevCZJUhWV",
						"amount": 50000
					}
				],
				"isIncoming": false,
				"isOutgoing": true
			},
			"outputs": [
				{
					"keyImage": {
						"hex": "4c19ea96bc3bb9d69c477a6cdb7a76650729edfff22a2017dc5e6ea7d94c6116"
					},
					"amount": 509403744036,
					"index": 2657543,
					"accountIndex": 0,
					"subaddressIndex": 0,
					"isSpent": false,
					"isFrozen": false,
					"isLocked": true
				},
				{
					"keyImage": {
						"hex": "2033769e0c1e1727bca816dbd175a4b086a2fd828f33af1a023e41920963e90f"
					},
					"amount": 50000,
					"index": 2657544,
					"accountIndex": 1,
					"subaddressIndex": 0,
					"isSpent": false,
					"isFrozen": false,
					"isLocked": true
				},
				{
					"keyImage": {
						"hex": "6df01e19842955a13fd8908753527fe2266e2c3ce393badfd053823aab57f8e7"
					},
					"amount": 50000,
					"index": 2657542,
					"accountIndex": 2,
					"subaddressIndex": 0,
					"isSpent": false,
					"isFrozen": false,
					"isLocked": true
				}
			],
		}
	]
}
```

The top level is a block which contains transactions.  Transactions may have incoming transfers and one outgoing transfer.  The outgoing transfer may have destination amounts and addresses (this information is only saved locally with the wallet and is not stored on the blockchain).  Transactions may also have outputs received by the wallet.