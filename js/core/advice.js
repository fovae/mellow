// Picks what is most useful right now. Pure: facts in, ids out.
export const DIFFICULT_MISSES = 2;
const BACKUP_DAYS = 14;

export function getAdvice({ hasActive, hasDictionaries, dueElsewhere, difficult, activeFinished, hasNextTopic, answers, lastBackup, now = Date.now() }) {
    const list = [];
    if (!hasDictionaries || !hasActive) list.push("library");
    if (dueElsewhere > 0) list.push("review");
    if (difficult >= 3) list.push("difficult");
    if (hasActive && activeFinished && hasNextTopic) list.push("next");
    if (answers >= 50 && (!lastBackup || now - lastBackup > BACKUP_DAYS * 86400000)) list.push("backup");
    return list.slice(0, 2);
}
