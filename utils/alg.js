// "New cards" tab
const NEW_STEPS = [15, 25, 35]  // in minutes
const GRADUATING_INTERVAL = 15  // in days
const EASY_INTERVAL = 4  // in days
const STARTING_EASE = 2.50  // in percent

//  "Reviews" tab
const EASY_BONUS = 1.30
const INTERVAL_MODIFIER = 1
const MAXIMUM_INTERVAL = 36500  // in days

// "Lapses" tab
const LAPSES_STEPS = [20]  // in minutes
const NEW_INTERVAL = 0.70
const MINIMUM_INTERVAL = 2  // in days

class Card {
    constructor() {
        this.status = 'learning' // can be 'learning', 'learned', or 'relearning'
        this.steps_index = 0
        this.ease_factor = STARTING_EASE
        this.interval = null
        this.history = []

        this.repr = this.repr.bind(this);
        this.choice = this.choice.bind(this);
        this.minutes_to_days = this.minutes_to_days.bind(this);
        this.prompt = this.prompt.bind(this);
        this.prompt_str = this.prompt_str.bind(this);
    }

    repr() {
        return `Card[${this.status}; steps_idx=${this.steps_index}; ease=${this.ease_factor}; interval=${this.interval}]`
    }

    choice(button) {
        //button is one of "wrong", "hard", "good", or "easy"
        // returns a result in days
        this.history.push(button)

        if (this.status === 'learning') {
            // for learning cards, there is no "hard" response possible
            if (button === 'wrong') {
                this.steps_index = 0
                return this.minutes_to_days(NEW_STEPS[this.steps_index])
            }
            else if (button === 'good') {
                this.steps_index += 1
                if (this.steps_index < NEW_STEPS.length) {
                    return this.minutes_to_days(NEW_STEPS[this.steps_index])
                } else {
                    // we have graduated!
                    this.status = 'learned'
                    this.interval = GRADUATING_INTERVAL
                    return this.interval
                }
            }
            else if (button === 'easy') {
                this.status = 'learned'
                this.interval = EASY_INTERVAL
                return EASY_INTERVAL
            }
            else {
                // raise ValueError("you can't press this button / we don't know how to deal with this case")
            }
        }
        else if (this.status === 'learned') {
            if (button === "wrong") {
                this.status = 'relearning'
                this.steps_index = 0
                this.ease_factor = Math.max(1.30, this.ease_factor - 0.20)
                // the anki manual says "the current interval is multiplied by the
                // value of new interval", but I have no idea what the "new
                // interval" is
                return this.minutes_to_days(LAPSES_STEPS[0])
            }
            else if (button === 'hard') {
                this.ease_factor = Math.max(1.30, this.ease_factor - 0.15)
                this.interval = this.interval * 1.2 * INTERVAL_MODIFIER
                return Math.min(MAXIMUM_INTERVAL, this.interval)
            }
            else if (button === 'good') {
                this.interval = (this.interval * this.ease_factor
                    * INTERVAL_MODIFIER)
                return Math.min(MAXIMUM_INTERVAL, this.interval)
            }
            else if (button === 'easy') {
                this.ease_factor += 0.15
                this.interval = (this.interval * this.ease_factor
                    * INTERVAL_MODIFIER * EASY_BONUS)
                return Math.min(MAXIMUM_INTERVAL, this.interval)
            }
            else {
                // raise ValueError("you can't press this button / we don't know how to deal with this case")
            }

        }
        else if (this.status === 'relearning') {
            if (button === "wrong") {
                this.steps_index = 0
                return this.minutes_to_days(LAPSES_STEPS[0])
            }
            else if (button === "good") {
                this.steps_index += 1
                if (this.steps_index < LAPSES_STEPS.length) {
                    return this.minutes_to_days(LAPSES_STEPS[this.steps_index])
                }
                else {
                    // we have re-graduated!
                    this.status = 'learned'
                    this.interval = Math.max(MINIMUM_INTERVAL, this.interval * NEW_INTERVAL)
                    return this.interval
                }
            } else {
                // raise ValueError("you can't press this button / we don't know how to deal with this case")
            }
        }
    }

    minutes_to_days(minutes) {
        return minutes / (60 * 24)
    }

    prompt() {
        let c = new Card()
        let wrong_ivl =  [...this.history, 'wrong'].map(x => c.choice(x)).pop()
        c = new Card()
        let hard_ivl =  [...this.history, 'hard'].map(x => c.choice(x)).pop()
        c = new Card()
        let good_ivl =  [...this.history, 'good'].map(x => c.choice(x)).pop()
        c = new Card()
        let easy_ivl =  [...this.history, 'easy'].map(x => c.choice(x)).pop()
        return {wrong_ivl, hard_ivl, good_ivl, easy_ivl}
    }
    prompt_str() {
        const promt_pp = (ivl, s) => {
            if (ivl) {
                if (ivl <= 1)
                    return `${s} ${ivl*1440}m`
                else
                    return `${s} ${ivl.toFixed(2)}d`
            }
        }
        const {wrong_ivl, hard_ivl, good_ivl, easy_ivl} = this.prompt()
        const s = [
            promt_pp(wrong_ivl, "wrong"),
            promt_pp(hard_ivl, "hard"),
            promt_pp(good_ivl, "good"),
            promt_pp(easy_ivl, "easy")
        ].filter(x => x !== undefined).join(" | ")
        return s
    }

}

module.exports = Card

// a = new Card()
// console.log(a.prompt_str())
// a.choice("good")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("good")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("good")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("good")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("good")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("good")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("good")
// console.log(a.repr())
// console.log(a.prompt_str())
//
//
//
//
// console.log()
// a = new Card()
// console.log(a.prompt_str())
// a.choice("good")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("good")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("wrong")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("good")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("good")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("good")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("wrong")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("wrong")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("wrong")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("good")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("wrong")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("good")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("wrong")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("good")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("wrong")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("good")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("wrong")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("good")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("wrong")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("good")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("wrong")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("good")
// console.log(a.repr())
// console.log(a.prompt_str())
// a.choice("wrong")
// console.log(a.repr())
