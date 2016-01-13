1. 除了立即执行函数等个别情况，一律不写分号
2. 除了`for`循环和某些迭代式算法等个别情况，全部使用`const`，上述情况使用`let`，永不使用`var`
3. 使用`forEach`来遍历数组
4. 仅在`map`，`reduce`等操作时使用Arrow Function，其它时候都使用`function`关键字，使用闭包来保存`this`指针的值
5. 一律使用`'use strict'`
6. 使用`Object.create(null)`而不是`new Map`，使用`for in`来遍历
7. catch所有Promise，即使它不会有异常
8. 对象和数组的字面量都不加末尾的多余逗号
