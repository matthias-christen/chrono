/*


*/

var moment = require('moment');
var Parser = require('../parser').Parser;
var ParsedResult = require('../../result').ParsedResult;
var ParsedComponents = require('../../result').ParsedComponents;

var PATTERN = /(\W|^)(now|today|tonight|last\s*night|(?:this|tomorrow|tmr|yesterday)\s*(morning|afternoon|evening|night)|tomorrow|tmr|yesterday)(?=\W|$)/i;

exports.Parser = function ENCasualDateParser(){

    Parser.apply(this, arguments);

    this.pattern = function() { return PATTERN; }

    this.extract = function(text, ref, match, opt){

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

        if(lowerText == 'tonight'){
            // Normally means this coming midnight
            result.start.imply('hour', 22);
            result.start.imply('meridiem', 1);

            endMoment = startMoment.clone();
            endMoment.add(1, 'day');
            endMoment.hour(6);

        } else if (/^tomorrow|^tmr/.test(lowerText)) {

            // Check not "Tomorrow" on late night
            if(refMoment.hour() > 1) {
                startMoment.add(1, 'day');
            }

        } else if (/^yesterday/.test(lowerText)) {

            startMoment.add(-1, 'day');

        } else if(lowerText.match(/last\s*night/)) {

            result.start.imply('hour', 0);
            if (refMoment.hour() > 6) {
                startMoment.add(-1, 'day');
            }

            endMoment = startMoment.clone();
            endMoment.add(1, 'day');
            endMoment.hour(6);

        } else if (lowerText.match("now")) {

          result.start.imply('hour', refMoment.hour());
          result.start.imply('minute', refMoment.minute());
          result.start.imply('second', refMoment.second());
          result.start.imply('millisecond', refMoment.millisecond());

        }

        if (match[3]) {
            endMoment = startMoment.clone();

            var secondMatch = match[3].toLowerCase();
            if (secondMatch == "afternoon") {

                result.start.imply('hour', 15);
                endMoment.hour(18);

            } else if (secondMatch == "evening") {

                result.start.imply('hour', 18);
                endMoment.hour(22);

            } else if (secondMatch == "morning") {

                result.start.imply('hour', 6);
                endMoment.hour(12);

            } else if (secondMatch == "night") {

                result.start.imply('hour', 22);
                endMoment.add(1, 'day');
                endMoment.hour(6);
            }
        }

        result.start.assign('day', startMoment.date());
        result.start.assign('month', startMoment.month() + 1);
        result.start.assign('year', startMoment.year());

//*
        if (endMoment && !result.end) {
            result.end = new ParsedComponents(null, endMoment.toDate());
            result.end.imply('hour', endMoment.hour());
        }
//*/
        result.tags['ENCasualDateParser'] = true;
        return result;
    }
}
