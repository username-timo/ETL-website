(function () {
  const { SITE_BASE_URL, DASHBOARD_URL } = window.ETLConfig;

  let getSessionToken = () => '';
  let getCurrentRole = () => '';
  let reloadRequests = async () => {};
  let reloadLPOs = async () => {};
  let reloadApprovals = async () => {};

  function sessionToken() {
    return typeof getSessionToken === 'function' ? getSessionToken() : '';
  }

  function currentRole() {
    return typeof getCurrentRole === 'function' ? getCurrentRole() : '';
  }

  function isPricingRequest(record) {
    const items = record && record.items ? record.items : [];
    return !!record
      && record.direction === 'inward'
      && Number(record.total || 0) <= 0
      && !items.some(item => Number(item.price || 0) > 0 || Number(item.total || 0) > 0);
  }

  async function sendEmail(to, subject, body) {
    const result = await ETLEmail.send(to, subject, body, {
      flow: 'internal_ops',
      context: 'dashboard'
    });
    return result.ok;
  }

  function closeModal() {
    document.getElementById('detail-modal').classList.remove('open');
  }

  function copyLink(uniqueLink) {
    const url = SITE_BASE_URL + '/ETL-LPO-View.html?lpo=' + uniqueLink;
    prompt('LPO link ready!\n\nShare this link with the supplier so they can view their LPO:', url);
  }

  async function updateLPOStatus(id, status) {
    try {
      await ETLDashboardApi.updateLpo(id, { status }, sessionToken());
      const badge = document.getElementById(`lpo-status-${id}`);
      if (badge) {
        const labels = {
          active: 'Active',
          issued: 'Issued',
          delivered: 'Delivered',
          paid: 'Paid',
          disputed: 'Disputed',
          closed: 'Closed'
        };
        badge.className = `badge badge-lpo-${status}`;
        badge.innerText = labels[status] || status;
      }
      await reloadLPOs();
    } catch (e) {
      alert('Network error: ' + e.message);
    }
  }

  async function updateStatus(id, status) {
    try {
      await ETLDashboardApi.updateQuotation(id, { status }, sessionToken());
      const badge = document.getElementById(`req-badge-${id}`);
      if (badge) {
        const labels = {
          pending_approval: 'Pending Approval',
          approved: 'Approved',
          in_progress: 'In Progress',
          responded: 'Responded',
          rejected: 'Rejected',
          closed: 'Closed'
        };
        badge.className = `badge badge-${status}`;
        badge.innerText = labels[status] || status;
      }

      if (status === 'approved') {
        const request = window._reqData && window._reqData.find(item => item.id === id);
        const name = request ? request.client_name : 'Client';
        const email = request ? request.client_email : '';
        const project = request ? request.project_title : 'Project';
        const emailSent = await sendEmail('tokui@usiu.ac.ke', `Action Required: Generate Quotation - ${name} | ${project}`, `A quotation request has been approved and is ready for you to generate.

CLIENT DETAILS:
Name: ${name}
Email: ${email}
Project: ${project}

Log in to the ETL Dashboard and click Generate Quotation to proceed.

Dashboard: ${DASHBOARD_URL}`);
        if (!emailSent) console.warn('Quotation approval saved, but staff notification email could not be sent.');
      }

      await reloadRequests();
    } catch (e) {
      alert('Network error: ' + e.message);
    }
  }

  function openGeneratorFromModal() {
    openGenerator(null, window._currentRequest);
  }

  function openGenerator(i, directRecord) {
    const request = directRecord || (i !== undefined && i !== null && window._reqData ? window._reqData[i] : null);
    if (request) {
      const params = new URLSearchParams({
        client_name: request.client_name || '',
        contact_person: request.contact_person || '',
        client_email: request.client_email || '',
        client_phone: request.client_phone || '',
        client_address: request.client_address || '',
        project_title: request.project_title || '',
        project_location: request.project_location || '',
        project_description: request.project_description || '',
        services_category: request.services_category || '',
        project_duration: request.project_duration || '',
        ref_id: request.id || ''
      });
      window.open('ETL-Quotation-generator.html?' + params.toString(), '_blank');
    } else {
      window.open('ETL-Quotation-generator.html', '_blank');
    }
  }

  function openGeneratorById(id) {
    const record = (window._reqData || []).find(request => request.id === id);
    if (record) openGenerator(null, record);
  }

  function prepareLpoQuotation(id) {
    window.open(`ETL-Quotation-generator.html?lpo_id=${encodeURIComponent(id)}`, '_blank');
  }

  function blockActionUntilApproval(actionName) {
    if (currentRole() === 'staff') {
      alert(`${actionName} is not available until the LPO is approved by Management.\n\nPlease ask your manager to review and approve this LPO first.`);
      return false;
    }
    return true;
  }

  async function rejectLPO(id) {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return;
    try {
      await ETLDashboardApi.updateLpo(id, { status: 'rejected', notes: reason || 'Rejected by management' }, sessionToken());
      alert('LPO has been rejected.');
      await reloadApprovals();
      await reloadLPOs();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  async function approveLPO(id) {
    const record = (window._lpoData || []).find(lpo => lpo.id === id);
    const requestMode = isPricingRequest(record);
    if (!confirm(`Approve this ${requestMode ? 'customer procurement request' : 'LPO'}?`)) return;
    try {
      await ETLDashboardApi.updateLpo(id, { status: 'approved' }, sessionToken());
      if (requestMode) {
        const emailSent = await sendEmail('tokui@usiu.ac.ke', `Action Required: Prepare Quotation - ${record.entity_name || 'Customer'} | ${record.project_name || record.lpo_number || 'Procurement Request'}`, `A customer procurement request has been approved and is ready for sourcing and pricing.

Customer: ${record.entity_name || '-'}
Email: ${record.entity_email || '-'}
Reference: ${record.lpo_number || '-'}
Project: ${record.project_name || '-'}

Log in to the ETL Dashboard and click Prepare Quotation to proceed.

Dashboard: ${DASHBOARD_URL}`);
        if (!emailSent) console.warn('Procurement request approved, but staff notification email could not be sent.');
      }
      alert(requestMode ? 'Procurement request approved. Staff can now prepare the quotation.' : 'LPO approved successfully!');
      await reloadApprovals();
      await reloadLPOs();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  function doApprove(index) {
    const request = window._approvalData[index];
    approveRequest(request.id, request.client_email, request.client_name, request.project_title);
  }

  function doReject(index) {
    const request = window._approvalData[index];
    rejectRequest(request.id, request.client_email, request.client_name, request.project_title);
  }

  function doApproveById(id, email, name, project) {
    approveRequest(id, email, name, project);
    closeModal();
  }

  function doRejectById(id, email, name, project) {
    rejectRequest(id, email, name, project);
    closeModal();
  }

  async function approveRequest(id, email, name, project) {
    if (!confirm(`Approve quotation request from ${name} for ${project}?`)) return;
    const approver = currentRole() === 'management' ? 'Management' : 'ETL Staff';
    try {
      await ETLDashboardApi.updateQuotation(id, {
        status: 'approved',
        approved_by: approver,
        approved_at: new Date().toISOString()
      }, sessionToken());

      const emailSent = await sendEmail('tokui@usiu.ac.ke', `Action Required: Generate Quotation - ${name} | ${project}`, `A quotation request has been approved by ${approver} and is ready for you to generate.

CLIENT DETAILS:
Name: ${name}
Email: ${email}
Project: ${project}

Please log in to the ETL Dashboard and click Generate Quotation to proceed.

Dashboard: ${DASHBOARD_URL}`);
      if (!emailSent) console.warn('Quotation approval saved, but staff notification email could not be sent.');

      alert(emailSent ? 'Request approved! ETL staff have been notified to generate the quotation.' : 'Request approved! Email notification could not be sent automatically.');
      await reloadApprovals();
      await reloadRequests();
    } catch (e) {
      alert('Could not update: ' + e.message);
    }
  }

  async function rejectRequest(id, email, name, project) {
    const reason = prompt(`Enter reason for rejecting ${name}'s request (this will be sent to the client):`);
    if (!reason) return;
    try {
      await ETLDashboardApi.updateQuotation(id, {
        status: 'rejected',
        rejection_reason: reason,
        approved_by: 'Management'
      }, sessionToken());

      const emailSent = await sendEmail(email, `Re: Your Quotation Request - ${project}`, `Dear ${name},

Thank you for reaching out to Engineering Trade Links Co. Ltd.

After reviewing your quotation request for "${project}", we regret that we are unable to proceed at this time.

Reason: ${reason}

We encourage you to reach out again in the future. We appreciate your interest in our services.

Kind regards,
Engineering Trade Links Co. Ltd
+256 776 566 522
tradelinks.ltd@gmail.com`);
      if (!emailSent) console.warn('Quotation rejected, but client email could not be sent.');
      alert(emailSent ? 'Request rejected and client has been notified by email.' : 'Request rejected, but the client email could not be sent automatically.');
      await reloadApprovals();
      await reloadRequests();
    } catch (e) {
      alert('Could not update: ' + e.message);
    }
  }

  function init(options) {
    options = options || {};
    getSessionToken = options.getSessionToken || getSessionToken;
    getCurrentRole = options.getCurrentRole || getCurrentRole;
    reloadRequests = options.loadRequests || reloadRequests;
    reloadLPOs = options.loadLPOs || reloadLPOs;
    reloadApprovals = options.loadApprovals || reloadApprovals;
  }

  window.ETLDashboardActions = {
    init,
    closeModal,
    copyLink,
    updateLPOStatus,
    updateStatus,
    openGeneratorFromModal,
    openGenerator,
    openGeneratorById,
    prepareLpoQuotation,
    blockActionUntilApproval,
    rejectLPO,
    approveLPO,
    doApprove,
    doReject,
    doApproveById,
    doRejectById,
    approveRequest,
    rejectRequest
  };

  window.closeModal = closeModal;
  window.copyLink = copyLink;
  window.updateLPOStatus = updateLPOStatus;
  window.updateStatus = updateStatus;
  window.openGeneratorFromModal = openGeneratorFromModal;
  window.openGenerator = openGenerator;
  window.openGeneratorById = openGeneratorById;
  window.prepareLpoQuotation = prepareLpoQuotation;
  window.blockActionUntilApproval = blockActionUntilApproval;
  window.rejectLPO = rejectLPO;
  window.approveLPO = approveLPO;
  window.doApprove = doApprove;
  window.doReject = doReject;
  window.doApproveById = doApproveById;
  window.doRejectById = doRejectById;
  window.approveRequest = approveRequest;
  window.rejectRequest = rejectRequest;
})();
