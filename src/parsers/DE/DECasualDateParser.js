/*


*/

var moment = require('moment');
var Parser = require('../parser').Parser;
var ParsedResult = require('../../result').ParsedResult;
var ParsedComponents = require('../../result').ParsedComponents;

var PATTERN = new RegExp(
    '(\\W|^)(' +
        'jetzt|' +
        '(?:heute|diesen)\\s*(morgen|vormittag|mittag|nachmittag|abend)|' +
        '(?:heute|diese)\\s*nacht|' +
        'heute|' +
        '(?:(?:ü|ue)ber)?morgen(?:\\s*(morgen|vormittag|mittag|nachmittag|abend|nacht))?|' +
        '(?:vor)?gestern(?:\\s*(morgen|vormittag|mittag|nachmittag|abend|nacht))?|' +
        'letzte\\s*nacht' +
    ')(?=\\W|$)', 'i');

exports.Parser = function DECasualDateParser() {

    Parser.apply(this, arguments);

    this.pattern = function() { return PATTERN; }

    this.extract = function(text, ref, match, opt) {
        var text = match[0].substr(match[1].length);
        var index = match.index + match[1].length;
        var result = new ParsedResult({
            index: index,
            text: text,
            ref: ref,
        });

        var refMoment = moment(ref);
        var startMoment = refMoment.clone();
        var endMoment = null;
        var lowerText = text.toLowerCase();

        if (/(?:heute|diese)\s*nacht/.test(lowerText)) {
            // Normally means this coming midnight
            result.start.imply('hour', 22);
            result.start.imply('meridiem', 1);

            endMoment = startMoment.clone();
            endMoment.add(1, 'day');
            endMoment.hour(6);
        } else if (/^(?:ü|ue)bermorgen/.test(lowerText)) {
            startMoment.add(refMoment.hour() > 1 ? 2 : 1, 'day');
        } else if (/^morgen/.test(lowerText)) {
            // Check not "Tomorrow" on late night
            if (refMoment.hour() > 1) {
                startMoment.add(1, 'day');
            }
        } else if (/^gestern/.test(lowerText)) {
            startMoment.add(-1, 'day');
        } else if (/^vorgestern/.test(lowerText)) {
            startMoment.add(-2, 'day');
        } else if (/letzte\s*nacht/.test(lowerText)) {
            result.start.imply('hour', 0);
            if (refMoment.hour() > 6) {
                startMoment.add(-1, 'day');
            }

            endMoment = startMoment.clone();
            endMoment.add(1, 'day');
            endMoment.hour(6);
        } else if (lowerText === 'jetzt') {
          result.start.imply('hour', refMoment.hour());
          result.start.imply('minute', refMoment.minute());
          result.start.imply('second', refMoment.second());
          result.start.imply('millisecond', refMoment.millisecond());
        }

        var secondMatch = match[3] || match[4] || match[5];
        if (secondMatch) {
            endMoment = startMoment.clone();

            switch (secondMatch.toLowerCase()) {
                case 'morgen':
                    result.start.imply('hour', 6);
                    endMoment.hour(12);
                    break;
                case 'vormittag':
                    result.start.imply('hour', 9);
                    endMoment.hour(12);
                    break;
                case 'mittag':
                    result.start.imply('hour', 12);
                    endMoment.hour(15);
                    break;
                case 'nachmittag':
                    result.start.imply('hour', 15);
                    result.start.imply('meridiem', 1);
                    endMoment.hour(18);
                    break;
                case 'abend':
                    result.start.imply('hour', 18);
                    result.start.imply('meridiem', 1);
                    endMoment.hour(22);
                    break;
                case 'nacht':
                    result.start.imply('hour', 22);
                    endMoment.add(1, 'day');
                    endMoment.hour(6);
                    break;
            }
        }

        result.start.assign('day', startMoment.date())
        result.start.assign('month', startMoment.month() + 1)
        result.start.assign('year', startMoment.year())

        if (endMoment && !result.end) {
            result.end = new ParsedComponents(null, endMoment.toDate());
            result.end.imply('hour', endMoment.hour());
        }

        result.tags['DECasualDateParser'] = true;
        return result;
    }
}
