# Poverty

> English [中文](./README-zh.md)

An account book stored in JSON.

## Features

### Amnesic Accounting

A transaction type `balance` is provided in Poverty, which can mitigate this problem.

A transaction of type `balance` indicates that a pool is at an exact balance at the given moment. For example, a `balance` which looks like below

```json
{
    "id": "T-2022-08-31",
    "name": "Robbed",
    "type": "balance",
    "price": 1.6,
    "currency": "USD",
    "time": "2022-08-31",
    "logtime": "2022-09-07",
    "note": "I wasn't able to record this until I bought a new phone a week after.",
    "source": "wallet"
}
```

indicates that something, apparently a robbing, happened before 08-31 and cause the balance in `wallet` changed, I couldn't figure that how much were robbed, but I do know this: I had only 1.6 dollars left at that exact moment, 08-31, which is when I got to check my `wallet` after I woke up in a hospital.

The difference between using a transaction of type `balance` and of type `transfer` is the authenticity.

Consider the history of `wallet` before the robbing is like below. For simplicity, `currency` , `logtime` , and `source` are hidden, as well as `type` .

```json
[{
    "id": "T-2022-08-20",
    "name": "Initial funds in my wallet",
    "price": 20,
    "time": "2022-08-20"
}, {
    "id": "T-2022-08-29",
    "name": "Milk",
    "price": -3,
    "time": "2022-08-29"
}]
```

At the end of the history above, 08-29, the balance of `wallet` is considered $20 - 3 = 17$ dollars. If the robbing is recorded with type `transfer` , it would be like

```json
[{
    "id": "T-2022-08-20",
    "name": "Initial funds in my wallet",
    "price": 20,
    "time": "2022-08-20"
}, {
    "id": "T-2022-08-29",
    "name": "Milk",
    "price": -3,
    "time": "2022-08-29"
}, {
    "id": "T-2022-08-31",
    "name": "Robbed",
    "type": "transfer",
    "price": -15.4,
    "time": "2022-08-31",
}]
```

where the final balance is also $20 - 3 - 15.4 = 1.6$ dollars, but its authenticity is in doubt, because I didn't actually confirm that the robber took 15.4 dollars from me, I just calculated it by subtracting the confirmed final balance 1.6 dollars from the last known balance 17 dollars, then I assume that $17 - 1.6 = 15.4$ should be what I have been took away.

Consider, after a month a friend of mine pay me back 5 dollars because he was in dire need on 08-30 so he just took 5 dollars from my `wallet` and forgot to acknowledge me about that. 

Now the point is not how bitchy that move was. The point is, after I recorded this transaction, the history of `wallet` will be like

```json
[{
    "id": "T-2022-08-20",
    "name": "Initial funds in my wallet",
    "price": 20,
    "time": "2022-08-20"
}, {
    "id": "T-2022-08-29",
    "name": "Milk",
    "price": -3,
    "time": "2022-08-29"
}, {
    "id": "T-2022-08-30",
    "name": "Lend",
    "price": -5,
    "time": "2022-08-30"
}, {
    "id": "T-2022-08-31",
    "name": "Robbed",
    "type": "transfer",
    "price": -15.4,
    "time": "2022-08-31",
}, {
    "id": "T-2022-10-05",
    "name": "Pay back",
    "price": 5,
    "time": "2022-10-05"
}]
```

As you might already notice, the final balance of `wallet` is not correct anymore. Due to the insertion of transaction `T-2022-08-30` , the balance after the robbing becomes $20 - 3 - 5 - 15.4 = -3.4$, which is wrong. It's wrong because I did confirm that the balance after robbing is 1.6 dollars, not a magic -3.4.

A normal accounting system requires users to know the exact information about every single transaction, which includes `price` and `transaction` itself. But for casual personal accounting, it's inevitable that some information could be missing. Hence a type `balance` for transactions:

```json
[{
    "id": "T-2022-08-20",
    "name": "Initial funds in my wallet",
    "type": "balance",
    "price": 20,
    "time": "2022-08-20"
}, {
    "id": "T-2022-08-29",
    "name": "Milk",
    "type": "transfer",
    "price": -3,
    "time": "2022-08-29"
}, {
    "id": "T-2022-08-30",
    "name": "Lend",
    "type": "transfer",
    "price": -5,
    "time": "2022-08-30"
}, {
    "id": "T-2022-08-31",
    "name": "Robbed",
    "type": "balance",
    "price": 1.6,
    "time": "2022-08-31",
}, {
    "id": "T-2022-10-05",
    "name": "Pay back",
    "type": "transfer",
    "price": 5,
    "time": "2022-10-05"
}]
```

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright © 2022, veringsek
