// Re-export from split modules to maintain route compatibility
const crud = require('./enterpriseCrudController');
const member = require('./enterpriseMemberController');
const join = require('./enterpriseJoinController');
const dept = require('./enterpriseDeptController');

module.exports = {
  getAll: crud.getAll,
  create: crud.create,
  get: crud.get,
  update: crud.update,
  remove: crud.remove,
  searchEnterprise: crud.searchEnterprise,
  lookupUser: crud.lookupUser,
  switchEnterprise: crud.switchEnterprise,

  addMember: member.addMember,
  updateMember: member.updateMember,
  removeMember: member.removeMember,
  updateMemberRole: member.updateMemberRole,

  joinEnterprise: join.joinEnterprise,
  listJoinRequests: join.listJoinRequests,
  approveJoinRequest: join.approveJoinRequest,
  rejectJoinRequest: join.rejectJoinRequest,
  myJoinRequests: join.myJoinRequests,

  addDepartment: dept.addDepartment,
  updateDepartment: dept.updateDepartment,
  removeDepartment: dept.removeDepartment,
};
