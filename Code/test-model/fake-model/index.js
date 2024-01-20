"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeModel = void 0;
const zod_1 = require("zod");
const validations_1 = require("@grnsft/if-models/build/util/validations");
class FakeModel {
    constructor() {
        this.fakeValues = ['fake-value1', 'fake-value2'];
    }
    /**
     * Configures the SCI-E Plugin.
     */
    async configure() {
        return this;
    }
    /**
     * Calculate the total emissions for a list of inputs.
     */
    async execute(inputs) {
        return inputs.map(input => {
            input['fake-total'] = this.calculateEnergy(input);
            return input;
        });
    }
    /**
     * Checks for required fields in input.
     */
    validateSingleInput(input) {
        const schema = zod_1.z
            .object({
            'fake-value1': zod_1.z.number().gte(0).min(0).optional(),
            'fake-value2': zod_1.z.number().gte(0).min(0).optional(),
        })
            .refine(validations_1.atLeastOneDefined, {
            message: `At least one of ${this.fakeValues} should present.`,
        });
        return (0, validations_1.validate)(schema, input);
    }
    /**
     * Calculates the sum of the energy components.
     */
    calculateEnergy(input) {
        const safeInput = this.validateSingleInput(input);
        return this.fakeValues.reduce((acc, metric) => {
            if (safeInput[metric]) {
                acc += safeInput[metric];
            }
            return acc;
        }, 0);
    }
}
exports.FakeModel = FakeModel;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL3NjaS1lL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZCQUFzQjtBQUt0Qix3REFBbUU7QUFFbkUsTUFBYSxTQUFTO0lBQXRCO1FBQ1Usa0JBQWEsR0FBRyxDQUFDLFlBQVksRUFBRSxlQUFlLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztJQW1ENUUsQ0FBQztJQWpEQzs7T0FFRztJQUNJLEtBQUssQ0FBQyxTQUFTO1FBQ3BCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVEOztPQUVHO0lBQ0ksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFxQjtRQUN4QyxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDeEIsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFOUMsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNLLG1CQUFtQixDQUFDLEtBQWtCO1FBQzVDLE1BQU0sTUFBTSxHQUFHLE9BQUM7YUFDYixNQUFNLENBQUM7WUFDTixZQUFZLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFO1lBQ2pELGVBQWUsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUU7WUFDcEQsZ0JBQWdCLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFO1NBQ3RELENBQUM7YUFDRCxNQUFNLENBQUMsK0JBQWlCLEVBQUU7WUFDekIsT0FBTyxFQUFFLG1CQUFtQixJQUFJLENBQUMsYUFBYSxrQkFBa0I7U0FDakUsQ0FBQyxDQUFDO1FBRUwsT0FBTyxJQUFBLHNCQUFRLEVBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRDs7T0FFRztJQUNLLGVBQWUsQ0FBQyxLQUFrQjtRQUN4QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFbEQsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUMvQyxJQUFJLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUN0QixHQUFHLElBQUksU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzNCLENBQUM7WUFFRCxPQUFPLEdBQUcsQ0FBQztRQUNiLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNSLENBQUM7Q0FDRjtBQXBERCw4QkFvREMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge3p9IGZyb20gJ3pvZCc7XG5cbmltcG9ydCB7TW9kZWxQbHVnaW5JbnRlcmZhY2V9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMnO1xuXG5pbXBvcnQge01vZGVsUGFyYW1zfSBmcm9tICcuLi8uLi90eXBlcy9jb21tb24nO1xuaW1wb3J0IHt2YWxpZGF0ZSwgYXRMZWFzdE9uZURlZmluZWR9IGZyb20gJy4uLy4uL3V0aWwvdmFsaWRhdGlvbnMnO1xuXG5leHBvcnQgY2xhc3MgU2NpRU1vZGVsIGltcGxlbWVudHMgTW9kZWxQbHVnaW5JbnRlcmZhY2Uge1xuICBwcml2YXRlIGVuZXJneU1ldHJpY3MgPSBbJ2VuZXJneS1jcHUnLCAnZW5lcmd5LW1lbW9yeScsICdlbmVyZ3ktbmV0d29yayddO1xuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIHRoZSBTQ0ktRSBQbHVnaW4uXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgY29uZmlndXJlKCk6IFByb21pc2U8TW9kZWxQbHVnaW5JbnRlcmZhY2U+IHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGUgdGhlIHRvdGFsIGVtaXNzaW9ucyBmb3IgYSBsaXN0IG9mIGlucHV0cy5cbiAgICovXG4gIHB1YmxpYyBhc3luYyBleGVjdXRlKGlucHV0czogTW9kZWxQYXJhbXNbXSk6IFByb21pc2U8TW9kZWxQYXJhbXNbXT4ge1xuICAgIHJldHVybiBpbnB1dHMubWFwKGlucHV0ID0+IHtcbiAgICAgIGlucHV0WydlbmVyZ3knXSA9IHRoaXMuY2FsY3VsYXRlRW5lcmd5KGlucHV0KTtcblxuICAgICAgcmV0dXJuIGlucHV0O1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBmb3IgcmVxdWlyZWQgZmllbGRzIGluIGlucHV0LlxuICAgKi9cbiAgcHJpdmF0ZSB2YWxpZGF0ZVNpbmdsZUlucHV0KGlucHV0OiBNb2RlbFBhcmFtcykge1xuICAgIGNvbnN0IHNjaGVtYSA9IHpcbiAgICAgIC5vYmplY3Qoe1xuICAgICAgICAnZW5lcmd5LWNwdSc6IHoubnVtYmVyKCkuZ3RlKDApLm1pbigwKS5vcHRpb25hbCgpLFxuICAgICAgICAnZW5lcmd5LW1lbW9yeSc6IHoubnVtYmVyKCkuZ3RlKDApLm1pbigwKS5vcHRpb25hbCgpLFxuICAgICAgICAnZW5lcmd5LW5ldHdvcmsnOiB6Lm51bWJlcigpLmd0ZSgwKS5taW4oMCkub3B0aW9uYWwoKSxcbiAgICAgIH0pXG4gICAgICAucmVmaW5lKGF0TGVhc3RPbmVEZWZpbmVkLCB7XG4gICAgICAgIG1lc3NhZ2U6IGBBdCBsZWFzdCBvbmUgb2YgJHt0aGlzLmVuZXJneU1ldHJpY3N9IHNob3VsZCBwcmVzZW50LmAsXG4gICAgICB9KTtcblxuICAgIHJldHVybiB2YWxpZGF0ZShzY2hlbWEsIGlucHV0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBzdW0gb2YgdGhlIGVuZXJneSBjb21wb25lbnRzLlxuICAgKi9cbiAgcHJpdmF0ZSBjYWxjdWxhdGVFbmVyZ3koaW5wdXQ6IE1vZGVsUGFyYW1zKSB7XG4gICAgY29uc3Qgc2FmZUlucHV0ID0gdGhpcy52YWxpZGF0ZVNpbmdsZUlucHV0KGlucHV0KTtcblxuICAgIHJldHVybiB0aGlzLmVuZXJneU1ldHJpY3MucmVkdWNlKChhY2MsIG1ldHJpYykgPT4ge1xuICAgICAgaWYgKHNhZmVJbnB1dFttZXRyaWNdKSB7XG4gICAgICAgIGFjYyArPSBzYWZlSW5wdXRbbWV0cmljXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCAwKTtcbiAgfVxufVxuIl19