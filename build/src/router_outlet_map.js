"use strict";
var RouterOutletMap = (function () {
    function RouterOutletMap() {
        this._outlets = {};
    }
    RouterOutletMap.prototype.registerOutlet = function (name, outlet) { this._outlets[name] = outlet; };
    return RouterOutletMap;
}());
exports.RouterOutletMap = RouterOutletMap;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyX291dGxldF9tYXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcm91dGVyX291dGxldF9tYXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUtBO0lBQUE7UUFFRSxhQUFRLEdBQW1DLEVBQUUsQ0FBQztJQUVoRCxDQUFDO0lBREMsd0NBQWMsR0FBZCxVQUFlLElBQVksRUFBRSxNQUFvQixJQUFVLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUM1RixzQkFBQztBQUFELENBQUMsQUFKRCxJQUlDO0FBSlksdUJBQWUsa0JBSTNCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBSb3V0ZXJPdXRsZXQgfSBmcm9tICcuL2RpcmVjdGl2ZXMvcm91dGVyX291dGxldCc7XG5cbi8qKlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBjbGFzcyBSb3V0ZXJPdXRsZXRNYXAge1xuICAvKiogQGludGVybmFsICovXG4gIF9vdXRsZXRzOiB7W25hbWU6IHN0cmluZ106IFJvdXRlck91dGxldH0gPSB7fTtcbiAgcmVnaXN0ZXJPdXRsZXQobmFtZTogc3RyaW5nLCBvdXRsZXQ6IFJvdXRlck91dGxldCk6IHZvaWQgeyB0aGlzLl9vdXRsZXRzW25hbWVdID0gb3V0bGV0OyB9XG59XG4iXX0=