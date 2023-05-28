export const logMiddleware = (call, next) => {
    console.log(call.context['$treenode'].type.name, call.name, call.args)
    next(call)
}