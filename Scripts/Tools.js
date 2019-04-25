/**
 * Return random number between min and max included
 * @param {int} max 
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}