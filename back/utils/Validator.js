class Validator {
    static validate(body, data) {
        return new Promise((resolve, reject) => {
            let requiredField = []
            let invalidType = []
            for (let dataKey in data) {
                if (typeof data[dataKey] === "string") data[dataKey] = Validator.parseCondition(data[dataKey]);
                let conditions = data[dataKey];
                // check if field is required
                if (conditions.required && body[dataKey] === undefined) requiredField.push(dataKey);
                if (body[dataKey] !== undefined) {
                    if (conditions.type !== undefined && !Validator.checkType(body[dataKey], conditions.type)) invalidType.push(dataKey);
                }
            }
            if (invalidType.length !== 0) reject(`Invalid type: ${invalidType.join(', ')}`);
            if (requiredField.length !== 0) reject(`Required fields: ${requiredField.join(', ')}`);
            resolve(true);
        })
    }

    static parseCondition(condition) {
        let conditions = {};
        condition.split('|').forEach((c) => {
            let cSplit = c.split(':');
            // check if condition is required
            conditions[cSplit[0]] = cSplit[1];
            if (cSplit[0] === "required") {
                conditions[cSplit[0]] = cSplit[1] === "true";
                return;
            }
            // check if result is number
            if (!isNaN(Number(cSplit[1]))) {
                conditions[cSplit[0]] = Number(cSplit[1]);
            }
        })
        return conditions;
    }

    static checkType(bodyElement, type) {
        if (type === "string") {
            return typeof bodyElement === "string";
        } else if (type === "number") {
            return !isNaN(Number(bodyElement));
        } else if (type === "date") {
            return !isNaN(Date.parse(bodyElement));
        } else if (type === "boolean") {
            return bodyElement === "true" || bodyElement === "false";
        } else if (type === "email") {
            return Validator.checkEmail(bodyElement);
        }
        return false;
    }

    static checkEmail(email) {
        let re = /\S+@\S+\.\S+/;
        return re.test(email);
    }

}

module.exports = Validator;