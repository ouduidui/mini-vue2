import {nextTick} from "../util/next-tick";

const queue = [];
let has = {};
let waiting = false;
let flushing = false;
let index = 0;

function resetSchedulerState() {
    index = queue.length = 0;
    has = {};
    waiting = flushing = false;
}

function flushSchedulerQueue() {
    flushing = true;
    let watcher, id;

    // 按照id的顺序执行watcher更新
    queue.sort((a, b) => a.id - b.id);
    for (index = 0; index < queue.length; index++) {
        watcher = queue[index];
        id = watcher.id;
        // 将正在更细你的watcher从映射表清空
        has[id] = null;
        // 执行更新函数
        watcher.run();
    }

    // 重置队列和状态
    resetSchedulerState();
}

// 将watcher插入队列
export function queueWatcher(watcher) {
    const id = watcher.id;

    // 去重，单个watcher只需要入队一次即可
    if (!has[id] || has[id] === null) {
        has[id] = true;  // 记录已经入队的id

        // 判断是否正在遍历更新
        if (!flushing) {
            queue.push(watcher);
        } else {
            // 如果正在遍历更新的话，将watcher按照id顺序插入
            let i = queue.length - 1;
            while (i > index && queue[i].id > watcher.id) {
                i--
            }
            // 将当前watcher插入队列中
            queue.splice(i + 1, 0, watcher);
        }

        if (!waiting) {
            waiting = true;
            // 异步方式将flushSchedulerQueue放入微任务队列
            nextTick(flushSchedulerQueue);
        }
    }
}
